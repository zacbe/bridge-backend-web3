import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { EventPayload } from '../schemas/event-payload.schema';
import { v4 as uuidv4 } from 'uuid';

export class EventFactory {
  static async createEvent(
    transactionId: EventPayload['transactionId'],
    type: EventPayload['type'],
    amount: string,
    from: EventPayload['from'] | null,
    to: EventPayload['to'] | null,
  ): Promise<EventPayload> {
    const event: EventPayload = {
      id: uuidv4(),
      transactionId,
      type,
      amount,
      from,
      to,
      timestamp: new Date().toISOString(),
    };

    // Validate event payload
    const eventInstance = plainToInstance(EventPayload, event);
    await validateOrReject(eventInstance);

    return eventInstance;
  }
}
