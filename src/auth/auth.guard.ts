import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const address = request.headers['x-address'] as string;
    const message = request.headers['x-message'] as string;
    const signature = request.headers['x-signature'] as string;

    if (!address || !message || !signature) {
      throw new UnauthorizedException('Missing authentication headers');
    }

    const isValid = await this.authService.verifyMessage(
      address,
      message,
      signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    request['user'] = { address };
    return true;
  }
}
