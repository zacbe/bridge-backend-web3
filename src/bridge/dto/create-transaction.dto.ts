import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupportedNetworks } from '../../../src/common/interfaces/supported-networks.enum';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Amount of tokens to bridge' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: 'Source network for bridge transaction' })
  @IsEnum(SupportedNetworks)
  @IsNotEmpty()
  sourceNetwork: SupportedNetworks;

  @ApiProperty({ description: 'Destination network for bridge transaction' })
  @IsEnum(SupportedNetworks)
  @IsNotEmpty()
  destinationNetwork: SupportedNetworks;

  @ApiProperty({ description: 'User wallet address' })
  @IsString()
  @IsNotEmpty()
  userAddress: string;
}
