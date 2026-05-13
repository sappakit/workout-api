import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserData } from '../enums/auth.enum';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as ActiveUserData | undefined;

    if (!user) return undefined;

    return field ? user[field] : user;
  },
);
