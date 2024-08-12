import {
  IsEnum,
  IsUUID,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { SupportedNetworks } from '../interfaces/supported-networks.enum';
import { EventType } from '../interfaces/event-types.enum';

export class EventPayload {
  @IsUUID()
  id: string;

  @IsUUID()
  transactionId: string;

  @IsEnum(EventType)
  type: EventType;

  @IsString()
  amount: string;

  @IsEnum(SupportedNetworks)
  @IsOptional()
  from: SupportedNetworks | null;

  @IsEnum(SupportedNetworks)
  @IsOptional()
  to: SupportedNetworks | null;

  @IsDateString()
  timestamp: string;
}
