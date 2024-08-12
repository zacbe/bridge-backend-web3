import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import { ArbitrumProvider } from './providers/arbitrum.provider';
import { OptimismProvider } from './providers/optimism.provider';
import { NetworkProvider } from './interfaces/network-provider.interface';
import { SupportedNetworks } from 'src/common/interfaces/supported-networks.enum';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private relay: GelatoRelay;

  constructor(private configService: ConfigService) {
    this.relay = new GelatoRelay();
  }

  async burnTokens(network: SupportedNetworks, amount: string): Promise<void> {
    try {
      const { walletAdmin, walletOperator } = this.getNetworkProvider(network);
      const contract = this.getContract(network, walletAdmin);
      const hasRole = await this.hasBridgeOperatorRole(
        contract,
        walletOperator.address,
      );

      if (!hasRole) {
        this.logger.log("Operator doesn't have BRIDGE_OPERATOR_ROLE");
        await this.assignRoles(contract, walletAdmin, walletOperator.address);
      }

      const amountToBurn = ethers.parseUnits(amount, 18);
      const burnData = contract.interface.encodeFunctionData(
        'bridgeBurnTokens',
        [walletOperator.address, amountToBurn],
      );

      const networkDetails = await walletOperator.provider.getNetwork();
      const chainId = networkDetails.chainId;
      const contractAddress = await contract.getAddress();

      const request = {
        chainId,
        target: contractAddress,
        data: burnData,
        user: walletOperator.address,
      };

      // Send the transaction using Gelato Relay
      const response = await this.relay.sponsoredCall(
        request,
        this.configService.get<string>('RELAY_API_KEY'),
      );

      // TODO: check gelato relay transaction status
      this.logger.log('Burn transaction sent:', response);
    } catch (error) {
      this.logger.error('Error sending burn transaction:', error);
      throw new Error(
        `Burn transaction failed on ${network}: ${error.message}`,
      );
    }
  }

  async mintTokens(network: SupportedNetworks, amount: string): Promise<void> {
    try {
      const { walletAdmin, walletOperator } = this.getNetworkProvider(network);
      const contract = this.getContract(network, walletAdmin);

      await this.assignRoles(contract, walletAdmin, walletOperator.address);
      const amountToMint = ethers.parseUnits(amount, 18);

      const mintData = contract.interface.encodeFunctionData(
        'bridgeMintTokens',
        [walletOperator.address, amountToMint],
      );

      const networkDetails = await walletOperator.provider.getNetwork();
      const chainId = networkDetails.chainId;
      const contractAddress = await contract.getAddress();

      const request = {
        chainId,
        target: contractAddress,
        data: mintData,
        user: walletOperator.address,
      };

      // Send the transaction using Gelato Relay
      const response = await this.relay.sponsoredCall(
        request,
        this.configService.get<string>('RELAY_API_KEY'),
      );

      // TODO: check gelato relay transaction status
      this.logger.log('Mint transaction sent:', response);
    } catch (error) {
      this.logger.error('Error sending mint transaction:', error);
      throw new Error(
        `Mint transaction failed on ${network}: ${error.message}`,
      );
    }
  }

  private getContract(network: SupportedNetworks, walletAdmin: ethers.Wallet) {
    const contractAddress = this.configService.get<string>(
      `${network.toUpperCase()}_CONTRACT_ADDRESS`,
    );
    const contractAbi = [
      'function hasRole(bytes32 role, address account) public view returns (bool)',
      'function assignMinterRole(address account) public',
      'function assignBridgeOperatorRole(address account) public',
      'function bridgeBurnTokens(address from, uint256 amount) public',
    ];

    return new ethers.Contract(contractAddress, contractAbi, walletAdmin);
  }

  private getNetworkProvider(network: SupportedNetworks): NetworkProvider {
    switch (network) {
      case SupportedNetworks.ARBITRUM:
        return new ArbitrumProvider(this.configService);
      case SupportedNetworks.OPTIMISM:
        return new OptimismProvider(this.configService);
      default:
        throw new Error('Unsupported network');
    }
  }

  private async assignRoles(
    contract: any, // TODO: reaplce with interface
    adminWallet: ethers.Wallet,
    operatorAddress: string,
  ): Promise<void> {
    const contractAddress = await contract.getAddress();
    console.log({ contractAddress, operatorAddress });

    // Assign the MINTER_ROLE to the operator wallet
    let transaction = await contract
      .connect(adminWallet)
      .assignMinterRole(operatorAddress);

    await transaction.wait();
    this.logger.log(
      `MINTER_ROLE assigned to ${operatorAddress} on ${contractAddress}`,
    );

    // Assign the BRIDGE_OPERATOR_ROLE to the operator wallet
    transaction = await contract
      .connect(adminWallet)
      .assignBridgeOperatorRole(operatorAddress);

    await transaction.wait();
    this.logger.log(
      `BRIDGE_OPERATOR_ROLE assigned to ${operatorAddress} on ${contractAddress}`,
    );
  }

  private async hasBridgeOperatorRole(
    contract: any,
    operatorAddress: string,
  ): Promise<boolean> {
    const roleHash = ethers.id('BRIDGE_OPERATOR_ROLE');
    const hasRole = await contract.hasRole(roleHash, operatorAddress);
    return hasRole;
  }
}
