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

export type FilterOperator = 'eq' | 'in';

export type RepositoryFilterConfig = {
  queryKey: string;
  field: string;
  operator?: FilterOperator;
};

export type SortDirection = 'ASC' | 'DESC';

export type RepositorySortConfig = {
  queryKey: string;
  field: string;
};

export type PaginateRepositoryOptions = {
  searchFields?: string[];
  filters?: RepositoryFilterConfig[];
  sorts?: RepositorySortConfig[];
};
