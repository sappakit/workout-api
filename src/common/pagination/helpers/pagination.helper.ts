import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  ObjectLiteral,
} from 'typeorm';
import {
  PaginatedResponse,
  RepositoryFilterConfig,
} from '../types/pagination.types';

export function buildPaginatedResponse<T extends ObjectLiteral>(
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

export function buildNestedWhere(
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

export function buildSearchWhere<T extends ObjectLiteral>(
  search: string | undefined,
  searchFields: string[] | undefined,
): FindOptionsWhere<T>[] | undefined {
  const trimmedSearch = search?.trim();

  if (!trimmedSearch || !searchFields?.length) {
    return undefined;
  }

  return searchFields.map((field) =>
    buildNestedWhere(field, ILike(`%${trimmedSearch}%`)),
  ) as FindOptionsWhere<T>[];
}

export function buildFilterWhere<T extends ObjectLiteral>(
  query: Record<string, unknown>,
  filters: RepositoryFilterConfig[] | undefined,
): FindOptionsWhere<T> | undefined {
  if (!filters?.length) {
    return undefined;
  }

  const whereObjects = filters
    .map((filter) => {
      const value = query[filter.queryKey];

      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return undefined;
      }

      const filterValue =
        filter.operator === 'in' && Array.isArray(value) ? In(value) : value;

      return buildNestedWhere(filter.field, filterValue);
    })
    .filter(Boolean) as FindOptionsWhere<T>[];

  if (!whereObjects.length) {
    return undefined;
  }

  return whereObjects.reduce(
    (acc, where) => ({
      ...acc,
      ...where,
    }),
    {},
  ) as FindOptionsWhere<T>;
}

export function buildFinalWhere<T extends ObjectLiteral>(
  optionsWhere: FindManyOptions<T>['where'],
  searchWhere: FindOptionsWhere<T>[] | undefined,
  filterWhere: FindOptionsWhere<T> | undefined,
): FindManyOptions<T>['where'] {
  if (searchWhere && filterWhere) {
    return searchWhere.map((searchItem) => ({
      ...filterWhere,
      ...searchItem,
    }));
  }

  if (searchWhere) {
    return searchWhere;
  }

  if (filterWhere) {
    return filterWhere;
  }

  return optionsWhere;
}
