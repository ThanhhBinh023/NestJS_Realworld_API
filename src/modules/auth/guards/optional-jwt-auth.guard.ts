import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = any>(
    _err: any,
    user: any,
    _info: any,
    _context: any,
    _status?: any,
  ): TUser {
    if (!user) {
      return undefined as any;
    }
    return user;
  }
}
