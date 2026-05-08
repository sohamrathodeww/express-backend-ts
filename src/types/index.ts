import { Request } from 'express';
import { Optional } from 'sequelize';

// ─── User Attributes ────────────────────────────────────────────────────────

export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

// ─── Request Bodies ──────────────────────────────────────────────────────────

export interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginRequestBody {
  email: string;
}

export interface UpdateUserRequestBody {
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ─── Query Params ────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Extended Request ────────────────────────────────────────────────────────

export interface TypedRequest<B = unknown, Q = unknown, P = unknown>
  extends Request {
  body: B;
  query: Q & Record<string, string | string[] | undefined>;
  params: P & Record<string, string>;
}
