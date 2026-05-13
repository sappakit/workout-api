import { ObjectLiteral } from 'typeorm';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export type PaginateRepositoryOptions = {
  searchFields?: string[];
};
