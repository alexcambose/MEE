import { PublicClient } from 'viem';

// Extend the PublicClient type to include Anvil methods
export type AnvilPublicClient = PublicClient & {
  request: {
    (args: {
      method: 'anvil_impersonateAccount';
      params: [string];
    }): Promise<null>;
    (args: {
      method: 'anvil_stopImpersonatingAccount';
      params: [string];
    }): Promise<null>;
  };
};
