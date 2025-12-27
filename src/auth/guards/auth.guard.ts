import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthType } from '../enums/auth.enum';
import { Reflector } from '@nestjs/core';
import { AUTH_TYPE_KEY } from '../decorators/auth.decorator';
import { JwtAccessGuard } from './jwt-access.guard';

@Injectable()
export class AppAuthGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.USER;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtGuard: JwtAccessGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AppAuthGuard.defaultAuthType];

    // Public route
    if (authTypes.includes(AuthType.PUBLIC)) {
      return true;
    }

    // Require authentication
    const request = context.switchToHttp().getRequest();

    const isAuthenticated = await this.jwtGuard.canActivate(context);
    if (!isAuthenticated) return false;

    // Admin check (for Next.js admin)
    if (authTypes.includes(AuthType.ADMIN)) {
      const user = request.user;
      if (user.role !== 'admin') {
        throw new ForbiddenException('Admin only');
      }
    }

    return true;
  }
}
