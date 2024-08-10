import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BridgeService } from './bridge.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './interfaces/transaction.interface';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Bridge')
@Controller('api/v1/bridge')
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a bridge transaction' })
  @ApiResponse({ status: 201, description: 'Bridge transaction created' })
  @ApiBody({ type: CreateTransactionDto })
  async createBridgeTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() request: Request,
  ): Promise<Transaction> {
    const user = request['user'];
    createTransactionDto.userAddress = user.address;
    return this.bridgeService.createBridgeTransaction(createTransactionDto);
  }

  @Get('transactions/status/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get the status of a specific transaction' })
  @ApiResponse({ status: 200, description: 'Transaction found.' })
  async getTransactionStatus(@Param('id') id: string): Promise<any> {
    return this.bridgeService.findTransactionById(id);
  }

  @Get('transactions/:userAddress')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all transactions for a specific user' })
  @ApiResponse({ status: 200, description: 'Transactions found.' })
  async getTransactionsByUser(
    @Param('userAddress') userAddress: string,
  ): Promise<any> {
    return this.bridgeService.findTransactionsByUser(userAddress);
  }
}
