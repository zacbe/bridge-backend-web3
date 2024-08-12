import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamoDBService {
  private client: DynamoDBDocumentClient;

  constructor(private configService: ConfigService) {
    const dynamoDBClient = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });

    this.client = DynamoDBDocumentClient.from(dynamoDBClient);
  }

  async putItem(params: PutCommandInput) {
    return this.client.send(new PutCommand(params));
  }

  async getItem(params: GetCommandInput) {
    return this.client.send(new GetCommand(params));
  }

  async query(params: QueryCommandInput) {
    return this.client.send(new QueryCommand(params));
  }

  async updateItem(params: UpdateCommandInput) {
    return this.client.send(new UpdateCommand(params));
  }

  async updateTransactionStatus(id: string, status: string) {
    const params: UpdateCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
    };

    return this.updateItem(params);
  }

  async findTransactionById(id: string) {
    const params: GetCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { id },
    };

    const result = await this.getItem(params);
    return result.Item;
  }

  async findTransactionsByUser(userAddress: string) {
    const params: QueryCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      IndexName: 'userAddress-index',
      KeyConditionExpression: 'userAddress = :userAddress',
      ExpressionAttributeValues: {
        ':userAddress': userAddress,
      },
    };

    const result = await this.query(params);
    return result.Items;
  }

  async updateTransactionDetails(
    id: string,
    networkType: 'from' | 'to',
    transactionHash: string,
    timestamp: string,
  ) {
    const params: UpdateCommandInput = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET #network.#transactionHash = :transactionHash, #network.#timestamp = :timestamp`,
      ExpressionAttributeNames: {
        '#network': networkType,
        '#transactionHash': 'transactionHash',
        '#timestamp': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':transactionHash': transactionHash,
        ':timestamp': timestamp,
      },
      ReturnValues: 'UPDATED_NEW',
    };

    return this.updateItem(params);
  }
}
