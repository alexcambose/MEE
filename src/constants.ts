import 'dotenv/config';
import { mcUSDC, type Url } from '@biconomy/abstractjs';
import { Address, parseAbi } from 'viem';
import { base } from 'viem/chains';

const eoaPrivateKey = process.env.EOA_PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;
const meeClientUrl = process.env.MEE_CLIENT_URL;

if (!eoaPrivateKey) {
  throw new Error('EOA_PRIVATE_KEY is not set');
}

if (!rpcUrl) {
  throw new Error('RPC_URL is not set');
}

if (!meeClientUrl) {
  throw new Error('MEE_CLIENT_URL is not set');
}

/**
 * EOA Private Key, used for testing
 */
export const EOA_PRIVATE_KEY = eoaPrivateKey as Address;

/**
 * RPC URL for the Base mainnet (for testing this should be anvil)
 */
export const RPC_URL = rpcUrl;

/**
 * MEE Client URL (for testing this should be url from the docker container)
 */
export const MEE_CLIENT_URL = meeClientUrl as Url;

/**
 * ERC20 ABI (reduced)
 */
export const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
]);

/**
 * USDC Address on Base
 */
export const USDC_ADDRESS = mcUSDC.addressOn(base.id);

/**
 * aUSDC Address on Base
 * https://basescan.org/address/0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB
 */
export const AUSDC_ADDRESS =
  '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB' as const;

/**
 * USDC Whale Address where we will send the USDC from via the impersonation
 * https://basescan.org/address/0xB4807865A786E9E9E26E6A9610F2078e7fc507fB
 */
export const USDC_WHALE_ADDRESS =
  '0xB4807865A786E9E9E26E6A9610F2078e7fc507fB' as const;
