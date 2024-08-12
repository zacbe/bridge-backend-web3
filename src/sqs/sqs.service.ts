import { Injectable, Logger } from '@nestjs/common';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageCommandInput,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqsService {
  private client: SQSClient;
  private readonly logger = new Logger(SqsService.name);

  constructor(private configService: ConfigService) {
    this.client = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async sendMessage(queueUrl: string, messageBody: string): Promise<void> {
    const params: SendMessageCommandInput = {
      QueueUrl: queueUrl,
      MessageBody: messageBody,
    };

    const command = new SendMessageCommand(params);

    try {
      const response = await this.client.send(command);
      this.logger.log('Message sent successfully:', response);
    } catch (error) {
      this.logger.error('Error sending message:', error);
    }
  }

  async receiveMessages(queueUrl: string): Promise<any[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    });

    try {
      const data = await this.client.send(command);
      return data.Messages || [];
    } catch (error) {
      this.logger.error('Error receiving messages:', error);
      return [];
    }
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    try {
      await this.client.send(command);
      this.logger.log('Message deleted successfully');
    } catch (error) {
      this.logger.error('Error deleting message:', error);
    }
  }
}
