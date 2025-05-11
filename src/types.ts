import { type PublicClient } from 'viem';

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
