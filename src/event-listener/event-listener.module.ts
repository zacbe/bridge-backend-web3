import { Module } from '@nestjs/common';
import { EventListenerService } from './event-listener.service';
import { SqsModule } from '../sqs/sqs.module';

@Module({
  imports: [SqsModule],
  providers: [EventListenerService],
})
export class EventListenerModule {}
