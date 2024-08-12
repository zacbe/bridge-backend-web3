import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { SqsService } from '../sqs/sqs.service';
import { Alchemy, Network } from 'alchemy-sdk';

@Injectable()
export class EventListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventListenerService.name);
  private arbitrumAlchemy: Alchemy;
  private optimismAlchemy: Alchemy;

  constructor(
    private configService: ConfigService,
    private sqsService: SqsService,
  ) {
    // Initialize Arbitrum Sepolia
    this.arbitrumAlchemy = new Alchemy({
      apiKey: this.configService.get<string>('ALCHEMY_API_KEY'),
      network: Network.ARB_SEPOLIA,
    });

    // Initialize Optimism Sepolia
    this.optimismAlchemy = new Alchemy({
      apiKey: this.configService.get<string>('ALCHEMY_API_KEY'),
      network: Network.OPT_SEPOLIA,
    });
  }

  async onModuleInit() {
    await this.startListening();
  }

  onModuleDestroy() {
    this.stopListening();
  }

  async startListening() {
    // Start listening for Arbitrum Sepolia events
    this.arbitrumAlchemy.ws.on(
      {
        address: this.configService.get<string>('ARBITRUM_CONTRACT_ADDRESS'),
        topics: [ethers.id('TokensBurned(address,uint256)')],
      },
      (log) => this.handleBurnEvent(log, 'Arbitrum'),
    );

    this.arbitrumAlchemy.ws.on(
      {
        address: this.configService.get<string>('ARBITRUM_CONTRACT_ADDRESS'),
        topics: [ethers.id('TokensMinted(address,uint256)')],
      },
      (log) => this.handleMintEvent(log, 'Arbitrum'),
    );

    // Start listening for Optimism Sepolia events
    this.optimismAlchemy.ws.on(
      {
        address: this.configService.get<string>('OPTIMISM_CONTRACT_ADDRESS'),
        topics: [ethers.id('TokensBurned(address,uint256)')],
      },
      (log) => this.handleBurnEvent(log, 'Optimism'),
    );

    this.optimismAlchemy.ws.on(
      {
        address: this.configService.get<string>('OPTIMISM_CONTRACT_ADDRESS'),
        topics: [ethers.id('TokensMinted(address,uint256)')],
      },
      (log) => this.handleMintEvent(log, 'Optimism'),
    );

    this.logger.log('Started listening on Arbitrum and Optimism Sepolia');
  }

  stopListening() {
    this.arbitrumAlchemy.ws.removeAllListeners();
    this.optimismAlchemy.ws.removeAllListeners();
    this.logger.log('Stopped listening to smart contract events');
  }

  private async handleBurnEvent(log: any, network: string) {
    const abiCoder = new ethers.AbiCoder();
    const decodedLog = abiCoder.decode(['address', 'uint256'], log.data);
    const from = decodedLog[0];
    const amount = decodedLog[1];

    this.logger.log(
      `Burn event detected on ${network}: ${from} burned ${amount.toString()} tokens`,
    );

    const message = {
      id: log.transactionHash,
      type: 'Burn',
      from,
      amount: amount.toString(),
      network,
      timestamp: new Date().toISOString(),
    };

    await this.sendMessageToSqs(message);
  }

  private async handleMintEvent(log: any, network: string) {
    const abiCoder = new ethers.AbiCoder();
    const decodedLog = abiCoder.decode(['address', 'uint256'], log.data);
    const to = decodedLog[0];
    const amount = decodedLog[1];

    this.logger.log(
      `Mint event detected on ${network}: ${to} received ${amount.toString()} tokens`,
    );

    const message = {
      id: log.transactionHash,
      type: 'Mint',
      to,
      amount: amount.toString(),
      network,
      timestamp: new Date().toISOString(),
    };

    await this.sendMessageToSqs(message);
  }

  private async sendMessageToSqs(message: any) {
    const queueUrl = this.configService.get<string>('SQS_QUEUE_URL');
    await this.sqsService.sendMessage(queueUrl, JSON.stringify(message));
    this.logger.log(`Sent message to SQS: ${JSON.stringify(message)}`);
  }
}
