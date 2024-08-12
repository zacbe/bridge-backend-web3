import { Module } from '@nestjs/common';
import { SqsWorkerService } from './sqs-worker.service';
import { ScheduleModule } from '@nestjs/schedule';
import { SqsModule } from '../sqs/sqs.module';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SqsModule,
    DynamoDBModule,
    ContractModule,
  ],
  providers: [SqsWorkerService],
})
export class SqsWorkerModule {}
