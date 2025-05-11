import {
  AavePoolAbi,
  createMeeClient,
  mcAaveV3Pool,
  mcUSDC,
  runtimeERC20BalanceOf,
  toFeeToken,
  toMultichainNexusAccount,
} from '@biconomy/abstractjs';

import chalk from 'chalk';
import {
  Address,
  createWalletClient,
  formatEther,
  http,
  parseUnits,
  PrivateKeyAccount,
  WalletClient,
} from 'viem';
import { base } from 'viem/chains';
import { eoaAccount, publicClient } from './client.ts';
import {
  AUSDC_ADDRESS,
  MEE_CLIENT_URL,
  RPC_URL,
  USDC_ADDRESS,
} from './constants.ts';
import {
  fundEoaWithUsdc,
  getErc20Balance,
  printAUSDCBalances,
  transferUsdc,
} from './utils.ts';

const initEoa = async () => {
  const EOA_MIN_USDC_BALANCE = 1000;

  console.log(chalk.gray(`EOA Address: ${eoaAccount.address}`));
  let balance = await getErc20Balance(USDC_ADDRESS, eoaAccount.address);
  if (balance < EOA_MIN_USDC_BALANCE) {
    console.log(
      chalk.gray(
        `EOA USDC Balance (${balance} USDC) is less than ${EOA_MIN_USDC_BALANCE} USDC. Funding EOA with USDC...`
      )
    );
    await fundEoaWithUsdc(eoaAccount.address, EOA_MIN_USDC_BALANCE * 10); // arbitrary multiplier so the account has enough funds
    balance = await getErc20Balance(USDC_ADDRESS, eoaAccount.address);
  }
  console.log(chalk.gray(`EOA USDC Balance: ${balance} USDC`));
  console.log(
    chalk.gray(
      `EOA ETH Balance: ${formatEther(
        await publicClient.getBalance({ address: eoaAccount.address })
      )}`
    )
  );
  const walletClient = createWalletClient({
    account: eoaAccount,
    chain: base,
    transport: http(RPC_URL),
  });
  return walletClient;
};

const initNexus = async (walletClient: WalletClient) => {
  const account = walletClient.account as PrivateKeyAccount;
  if (!account) {
    throw new Error('Wallet client account is undefined');
  }

  const mcNexus = await toMultichainNexusAccount({
    chains: [base],
    transports: [http(RPC_URL)],
    signer: account,
  });

  const meeClient = await createMeeClient({
    account: mcNexus,
    url: MEE_CLIENT_URL,
  });
  const nexusAddress = mcNexus.addressOn(base.id);
  if (!nexusAddress) {
    throw new Error('Nexus address is undefined');
  }
  console.log(chalk.blueBright(`Nexus Address: ${nexusAddress}`));
  let nexusUSDCBalance = await getErc20Balance(USDC_ADDRESS, nexusAddress);

  if (nexusUSDCBalance == 0) {
    console.log('Transferring USDC to Nexus...');
    await transferUsdc(walletClient, nexusAddress, 100);
    console.log('USDC transferred to Nexus');
    nexusUSDCBalance = await getErc20Balance(USDC_ADDRESS, nexusAddress);
  }
  console.log(chalk.blueBright(`Nexus USDC Balance: ${nexusUSDCBalance} USDC`));
  return { mcNexus, meeClient };
};

const main = async () => {
  /**
   * Initialize EOA
   * 1. Make sure the EOA has enough USDC
   */
  const walletClient = await initEoa();

  /**
   * Initialize Nexus
   * 1. Transfer USDC from the EOA to the smart wallet
   * 2. Init smart wallet
   */
  const { mcNexus, meeClient } = await initNexus(walletClient);

  await printAUSDCBalances(
    eoaAccount.address,
    mcNexus.addressOn(base.id, true)
  );

  const usdcAmount = '10';
  const amountConsumed = parseUnits(usdcAmount, 6);

  console.log(
    chalk.bgMagenta(
      `Triggering orchestration... Sending ${usdcAmount} USDC to Aave`
    )
  );
  /**
   * TX #1
   * Approve Aave to spend USDC
   */
  const approveAAVEtoSpendUSDC = await mcNexus.buildComposable({
    type: 'approve',
    data: {
      chainId: base.id,
      tokenAddress: mcUSDC.addressOn(base.id),
      spender: mcAaveV3Pool.addressOn(base.id),
      amount: amountConsumed,
    },
  });

  /**
   * TX #2
   * Supply USDC to Aave
   */
  const supplyUsdcToAAVE = await mcNexus.buildComposable({
    type: 'default',
    data: {
      abi: AavePoolAbi,
      to: mcAaveV3Pool.addressOn(base.id),
      chainId: base.id,
      functionName: 'supply',
      args: [USDC_ADDRESS, amountConsumed, mcNexus.addressOn(base.id, true), 0],
    },
  });

  /**
   * TX #3
   * Transfer aUSDC back to the user's EOA
   */
  const moveAUSDCBackToEOA = await mcNexus.buildComposable({
    type: 'transfer',
    data: {
      amount: runtimeERC20BalanceOf({
        tokenAddress: AUSDC_ADDRESS,
        targetAddress: mcNexus.addressOn(base.id, true),
      }),
      chainId: base.id,
      recipient: eoaAccount.address,
      tokenAddress: AUSDC_ADDRESS,
    },
  });

  // Get a quote for executing the entire sequence
  const transferToNexusTrigger = {
    tokenAddress: mcUSDC.addressOn(base.id),
    amount: amountConsumed,
    chainId: base.id,
  };
  const quote = await meeClient.getFusionQuote({
    trigger: transferToNexusTrigger,
    feeToken: toFeeToken({
      chainId: base.id,
      mcToken: mcUSDC,
    }),

    instructions: [
      // TX #1
      approveAAVEtoSpendUSDC,
      // TX #2
      supplyUsdcToAAVE,
      // TX #3
      moveAUSDCBackToEOA,
    ],
  });
  console.log(chalk.blueBright(`Got Quote: ${quote.quote.hash}`));
  console.log(
    chalk.blueBright(
      `Execution cost: ${quote.quote.paymentInfo.tokenAmount} USDC ($${quote.quote.paymentInfo.tokenValue})`
    )
  );
  // Execute the quote
  const { hash } = await meeClient.executeFusionQuote({
    fusionQuote: quote,
  });
  console.log(chalk.blueBright(`Started execution: ${hash}`));

  // Wait for the entire transaction sequence to complete
  const receipt = await meeClient.waitForSupertransactionReceipt({ hash });
  console.log(
    chalk.green(
      `Successful execution. Transaction hashes: ${receipt.receipts.map(
        (e) => e.transactionHash
      )}`
    )
  );
  console.log(chalk.bgMagenta(`Orchestration complete`));

  await printAUSDCBalances(
    eoaAccount.address,
    mcNexus.addressOn(base.id, true)
  );
};

(async () => {
  const startTime = performance.now();
  await main();
  const endTime = performance.now();
  console.log(chalk.greenBright(`Time taken: ${endTime - startTime}ms`));
})();
