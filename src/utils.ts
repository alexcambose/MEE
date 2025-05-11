import { Account, Address, createWalletClient, http, WalletClient } from 'viem';
import { base } from 'viem/chains';
import { publicClient } from './client';
import {
  AUSDC_ADDRESS,
  ERC20_ABI,
  RPC_URL,
  USDC_ADDRESS,
  USDC_WHALE_ADDRESS,
} from './constants';
import chalk from 'chalk';

/**
 * Returns the balance of an ERC20 token for a given address.
 * @param erc20Address - The address of the ERC20 token.
 * @param address - The address to check the balance of.
 * @returns The balance of the ERC20 token in human-readable format.
 */
export async function getErc20Balance(erc20Address: Address, address: Address) {
  const [rawBalance, decimals] = await Promise.all([
    publicClient.readContract({
      address: erc20Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
    publicClient.readContract({
      address: erc20Address,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }),
  ]);
  return Number(rawBalance) / 10 ** Number(decimals);
}
/**
 * Transfer USDC from the EOA to the smart wallet
 * @param walletClient - The wallet client to use
 * @param to - The address to transfer the USDC to
 * @param amount - The amount of USDC to transfer
 * @returns The hash of the transaction
 */
export async function transferUsdc(
  walletClient: WalletClient,
  to: Address,
  amount: number
) {
  // Get decimals to convert human-readable amount to raw
  const decimals = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });
  const rawAmount = BigInt(Math.floor(Number(amount) * 10 ** Number(decimals)));

  // Send transfer transaction
  const hash = await walletClient.writeContract({
    account: walletClient.account as Account,
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, rawAmount],
    chain: base,
  });

  return hash;
}

export async function fundEoaWithUsdc(eoaAddress: Address, usdcAmount: number) {
  try {
    // 1. Check EOA USDC balance
    const decimals = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    // 2. Impersonate whale
    await publicClient.request({
      method: 'anvil_impersonateAccount',
      params: [USDC_WHALE_ADDRESS],
    });

    // 3. Create wallet client for whale (no private key needed)
    const walletClient = createWalletClient({
      account: USDC_WHALE_ADDRESS,
      transport: http(RPC_URL),
    });

    // 4. Transfer USDC
    const amount = usdcAmount * 10 ** Number(decimals);
    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [eoaAddress, BigInt(amount)],
      account: USDC_WHALE_ADDRESS,
      chain: base,
    });

    // 5. Stop impersonating
    await publicClient.request({
      method: 'anvil_stopImpersonatingAccount',
      params: [USDC_WHALE_ADDRESS],
    });

    return txHash;
  } catch (error) {
    console.error('Error funding EOA with USDC:', error);
  } finally {
    // 5. Stop impersonating
    await publicClient.request({
      method: 'anvil_stopImpersonatingAccount',
      params: [USDC_WHALE_ADDRESS],
    });
  }
}

/**
 * Print the balance of aUSDC for the EOA and Nexus
 * @param eoaAddress - The address of the EOA
 * @param nexusAddress - The address of the Nexus
 */
export const printAUSDCBalances = async (
  eoaAddress: Address,
  nexusAddress: Address
) => {
  const [eoaUSDCBalance, nexusUSDCBalance] = await Promise.all([
    getErc20Balance(AUSDC_ADDRESS, eoaAddress),
    getErc20Balance(AUSDC_ADDRESS, nexusAddress),
  ]);
  console.log(chalk.cyanBright(`EOA aUSDC Balance: ${eoaUSDCBalance} aUSDC`));
  console.log(
    chalk.cyanBright(`Nexus aUSDC Balance: ${nexusUSDCBalance} aUSDC`)
  );
};
