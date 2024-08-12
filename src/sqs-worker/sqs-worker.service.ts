import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SqsService } from '../sqs/sqs.service';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { ContractService } from '../contract/contract.service';
import { ConfigService } from '@nestjs/config';
import { EventPayload } from '../common/schemas/event-payload.schema';
import { EventType } from '../common/interfaces/event-types.enum';
import { SupportedNetworks } from '../common/interfaces/supported-networks.enum';

@Injectable()
export class SqsWorkerService {
  private readonly logger = new Logger(SqsWorkerService.name);

  constructor(
    private configService: ConfigService,
    private readonly sqsService: SqsService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly contractService: ContractService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pollMessages() {
    const queueUrl = this.configService.get<string>('SQS_QUEUE_URL');
    const messages = await this.sqsService.receiveMessages(queueUrl);

    for (const message of messages) {
      this.logger.log(`Received message: ${message.Body}`);
      await this.handleMessage(message.Body);
      await this.sqsService.deleteMessage(queueUrl, message.ReceiptHandle);
    }
  }

  private async handleMessage(messageBody: string): Promise<void> {
    const message: EventPayload = JSON.parse(messageBody);

    switch (message.type) {
      case EventType.BRIDGE:
        await this.handleBridgeEvent(message);
        break;
      case EventType.BURN:
        await this.handleBurnedEvent(message);
        break;
      case EventType.MINT:
        await this.handleMintedEvent(message);
        break;
      default:
        this.logger.warn(`Unknown event type: ${message.type}`);
    }
  }

  private async handleBridgeEvent(message: EventPayload): Promise<void> {
    try {
      const transaction = await this.dynamoDBService.findTransactionById(
        message.transactionId,
      );

      if (transaction.status === 'PENDING') {
        const sourceNetwork = this.getNetwork(message.from);
        await this.contractService.burnTokens(sourceNetwork, message.amount);
      }
    } catch (error) {
      this.logger.error('Error handling bridge event:', error);
    }
  }

  private async handleBurnedEvent(message: EventPayload): Promise<void> {
    try {
      const destinationNetwork = this.getNetwork(message.to);
      await this.contractService.mintTokens(destinationNetwork, message.amount);

      // update transaction status
      await this.dynamoDBService.updateTransactionStatus(
        message.transactionId,
        'BURNED',
      );
    } catch (error) {
      this.logger.error('Error handling burn event:', error);
    }
  }

  private async handleMintedEvent(message: EventPayload): Promise<void> {
    this.logger.log(`Transaction ${message.transactionId} marked as COMPLETED`);

    // update transaction status
    await this.dynamoDBService.updateTransactionStatus(
      message.transactionId,
      'COMPLETED',
    );
  }

  private getNetwork(network: string): SupportedNetworks {
    switch (network.toUpperCase()) {
      case SupportedNetworks.ARBITRUM:
        return SupportedNetworks.ARBITRUM;
      case SupportedNetworks.OPTIMISM:
        return SupportedNetworks.OPTIMISM;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }
}
