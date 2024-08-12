import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

import { NetworkProvider } from '../interfaces/network-provider.interface';

export class ArbitrumProvider implements NetworkProvider {
  provider: ethers.JsonRpcProvider;
  walletAdmin: ethers.Wallet;
  walletOperator: ethers.Wallet;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('ARBITRUM_RPC_URL'),
    );

    this.walletAdmin = new ethers.Wallet(
      this.configService.get<string>('PRIVATE_KEY_ADMIN'),
      this.provider,
    );

    this.walletOperator = new ethers.Wallet(
      this.configService.get<string>('PRIVATE_KEY_OPERATOR'),
      this.provider,
    );
  }
}
