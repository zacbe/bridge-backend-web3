import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  async verifyMessage(
    address: string,
    message: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Error verifying message:', error);
      return false;
    }
  }
}
