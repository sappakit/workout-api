import { Injectable } from '@nestjs/common';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PagingDto } from '../dto/request.dto';
import {
  PaginatedResponse,
  PaginateRepositoryOptions,
} from './types/paginationtypes';

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

  private buildNestedWhere(
    path: string,
    value: unknown,
  ): Record<string, unknown> {
    const keys = path.split('.');

    return keys.reduceRight<Record<string, unknown>>((acc, key, index) => {
      if (index === keys.length - 1) {
        return { [key]: value };
      }

      return { [key]: acc };
    }, {});
  }

  private buildSearchWhere<T extends ObjectLiteral>(
    search: string | undefined,
    searchFields: string[] | undefined,
  ): FindOptionsWhere<T>[] | undefined {
    const trimmedSearch = search?.trim();

    if (!trimmedSearch || !searchFields?.length) {
      return undefined;
    }

    return searchFields.map((field) =>
      this.buildNestedWhere(field, ILike(`%${trimmedSearch}%`)),
    ) as FindOptionsWhere<T>[];
  }

  async paginateRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: FindManyOptions<T>,
    query: PagingDto,
    paginateOptions?: PaginateRepositoryOptions,
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10, search } = query;

    const searchWhere = this.buildSearchWhere<T>(
      search,
      paginateOptions?.searchFields,
    );

    const [data, total] = await repository.findAndCount({
      ...options,
      where: searchWhere ?? options.where,
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
