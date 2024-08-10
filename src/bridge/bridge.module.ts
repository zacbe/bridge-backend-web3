import { Module } from '@nestjs/common';
import { BridgeController } from './bridge.controller';
import { BridgeService } from './bridge.service';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { SqsModule } from '../sqs/sqs.module';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [DynamoDBModule, SqsModule, AuthModule],
  providers: [BridgeService, AuthService],
  controllers: [BridgeController],
})
export class BridgeModule {}
