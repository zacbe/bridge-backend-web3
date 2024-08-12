import { ethers } from 'ethers';

export interface NetworkProvider {
  provider: ethers.JsonRpcProvider;
  walletAdmin: ethers.Wallet;
  walletOperator: ethers.Wallet;
}
