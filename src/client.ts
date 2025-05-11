import { createPublicClient, http, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { EOA_PRIVATE_KEY, RPC_URL } from './constants';
import type { AnvilPublicClient } from './types';

export const eoaAccount = privateKeyToAccount(EOA_PRIVATE_KEY);

export const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
}) as AnvilPublicClient;
