import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthType } from '../enums/auth.enum';

export const AUTH_TYPE_KEY = 'authType';

export function Auth(...types: AuthType[]) {
  const decorators: Array<ClassDecorator | MethodDecorator> = [
    SetMetadata(AUTH_TYPE_KEY, types),
  ];

  if (!types.includes(AuthType.PUBLIC)) {
    decorators.push(
      ApiBearerAuth('access-token'),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
  }

  return applyDecorators(...decorators);
}
