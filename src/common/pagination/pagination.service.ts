import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PagingDto } from '../dto/request.dto';
import {
  PaginatedResponse,
  PaginateRepositoryOptions,
} from './types/pagination.types';
import {
  buildFilterWhere,
  buildFinalWhere,
  buildPaginatedResponse,
  buildSearchWhere,
} from './helpers/pagination.helper';

@Injectable()
export class PaginationService {
  async paginateRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    query: PagingDto,
    paginateOptions?: PaginateRepositoryOptions,
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10, search } = query;

    const searchWhere = buildSearchWhere<T>(
      search,
      paginateOptions?.searchFields,
    );

    const filterWhere = buildFilterWhere<T>(
      query as Record<string, unknown>,
      paginateOptions?.filters,
    );

    const where = buildFinalWhere<T>(options.where, searchWhere, filterWhere);

    const [data, total] = await repository.findAndCount({
      ...options,
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResponse(data, total, page, limit);
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

    return buildPaginatedResponse(data, total, page, limit);
  }
}
