import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BridgeModule } from './bridge/bridge.module';
import { DynamoDBModule } from './dynamodb/dynamodb.module';
import { SqsModule } from './sqs/sqs.module';
import { ContractModule } from './contract/contract.module';
import { SqsWorkerModule } from './sqs-worker/sqs-worker.module';
import { EventListenerModule } from './event-listener/event-listener.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DynamoDBModule,
    BridgeModule,
    SqsModule,
    ContractModule,
    SqsWorkerModule,
    EventListenerModule,
    AuthModule,
  ],
})
export class AppModule {}
