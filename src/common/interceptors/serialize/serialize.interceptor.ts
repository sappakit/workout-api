import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';
import { SERIALIZE_DTO_KEY } from './serialize.decorator';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  private isPaginated(data: any): boolean {
    return (
      data && typeof data === 'object' && Array.isArray(data.data) && data.meta
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const dto = this.reflector.getAllAndOverride<any>(SERIALIZE_DTO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!dto) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // Paginated response
        if (this.isPaginated(data)) {
          return {
            ...data,
            data: plainToInstance(dto, data.data, {
              excludeExtraneousValues: true,
            }),
          };
        }

        // Normal response
        return plainToInstance(dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
