import { Injectable } from '@nestjs/common';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { SqsService } from '../sqs/sqs.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  Transaction,
  TransactionStatus,
} from './interfaces/transaction.interface';
import { EventFactory } from '../common/factories/event-factory';
import {
  EventPayload,
  EventType,
} from '../common/schemas/event-payload.schema';

@Injectable()
export class BridgeService {
  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly sqsService: SqsService,
  ) {}

  async createBridgeTransaction(createTransactionDto: CreateTransactionDto) {
    const transaction: Transaction = {
      id: uuidv4(),
      userAddress: createTransactionDto.userAddress,
      from: {
        network: createTransactionDto.sourceNetwork,
        transactionHash: null,
        timestamp: null,
      },
      to: {
        network: createTransactionDto.destinationNetwork,
        transactionHash: null,
        timestamp: null,
      },
      amount: createTransactionDto.amount,
      status: TransactionStatus.Pending,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dynamoDBService.putItem({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: transaction,
    });

    const event: EventPayload = await EventFactory.createEvent(
      transaction.id,
      EventType.BRIDGE,
      createTransactionDto.amount,
      createTransactionDto.sourceNetwork,
      createTransactionDto.destinationNetwork,
    );

    await this.sqsService.sendMessage(
      process.env.SQS_QUEUE_URL,
      JSON.stringify(event),
    );

    return transaction as Transaction;
  }

  async findTransactionById(id: string) {
    const result = await this.dynamoDBService.findTransactionById(id);

    return result as Transaction;
  }

  async findTransactionsByUser(userAddress: string) {
    const result =
      await this.dynamoDBService.findTransactionsByUser(userAddress);
    return result as Transaction[];
  }
}
