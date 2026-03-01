import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PagingDto } from '../dto/request.dto';
import { PaginatedResponse } from './types/paginationtypes';

@Injectable()
export class PaginationService {
  private buildResponse<T extends ObjectLiteral>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async paginateRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    query: PagingDto,
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = query;

    const [data, total] = await repository.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });

    return this.buildResponse(data, total, page, limit);
  }

  async paginateQueryBuilder<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    query: PagingDto,
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = query;

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return this.buildResponse(data, total, page, limit);
  }
}
