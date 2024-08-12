import { BaseContract, ContractTransaction, BigNumberish } from 'ethers';

export interface IBridgeContract extends BaseContract {
  assignMinterRole(account: string): Promise<ContractTransaction>;
  assignBridgeOperatorRole(account: string): Promise<ContractTransaction>;
  bridgeBurnTokens(
    from: string,
    amount: BigNumberish,
  ): Promise<ContractTransaction>;
  bridgeMintTokens(
    to: string,
    amount: BigNumberish,
  ): Promise<ContractTransaction>;
}
