import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import User from '../models/User';
import {
  ApiResponse,
  RegisterRequestBody,
  LoginRequestBody,
  UpdateUserRequestBody,
  PaginationQuery,
  PaginationMeta,
  TypedRequest,
  UserAttributes,
} from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

const sendResponse = <T>(
  res: Response,
  status: number,
  success: boolean,
  message: string,
  data?: T,
  meta?: PaginationMeta
): void => {
  const response: ApiResponse<T> = { success, message, ...(data !== undefined && { data }), ...(meta && { meta }) };
  res.status(status).json(response);
};

// ─── POST /auth/register ──────────────────────────────────────────────────────

export const registerUser = async (
  req: TypedRequest<RegisterRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email } = req.body;

    // Check for existing email
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      sendResponse(res, StatusCodes.CONFLICT, false, 'Email address is already registered', undefined);
      return;
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    sendResponse(res, StatusCodes.CREATED, true, 'User registered successfully', user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────

export const loginUser = async (
  req: TypedRequest<LoginRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email: email.toLowerCase(), isActive: true },
    });

    if (!user) {
      sendResponse(res, StatusCodes.UNAUTHORIZED, false, 'No active account found with this email address');
      return;
    }

    sendResponse(res, StatusCodes.OK, true, 'Login successful', {
      user: user.toSafeJSON(),
      // In a real app you would generate a JWT token here
      // token: generateJWT(user.id),
      loginAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /users ───────────────────────────────────────────────────────────────

export const listUsers = async (
  req: TypedRequest<unknown, PaginationQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: Record<string, unknown> = { isActive: true };
    if (search) {
      whereClause[Op.or as unknown as string] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const validSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const orderDir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: [[orderField, orderDir]],
      limit: limitNum,
      offset,
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });

    const totalPages = Math.ceil(count / limitNum);
    const meta: PaginationMeta = {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPreviousPage: pageNum > 1,
    };

    sendResponse(
      res,
      StatusCodes.OK,
      true,
      `${count} user(s) found`,
      rows.map((u) => u.toSafeJSON()),
      meta
    );
  } catch (error) {
    next(error);
  }
};

// ─── GET /users/:id ───────────────────────────────────────────────────────────

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params['id'], 10);

    const user = await User.findOne({
      where: { id },
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      sendResponse(res, StatusCodes.NOT_FOUND, false, `User with ID ${id} not found`);
      return;
    }

    sendResponse(res, StatusCodes.OK, true, 'User retrieved successfully', user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

// ─── PUT /users/:id ───────────────────────────────────────────────────────────

export const updateUser = async (
  req: TypedRequest<UpdateUserRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params['id'], 10);
    const { firstName, lastName, email } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      sendResponse(res, StatusCodes.NOT_FOUND, false, `User with ID ${id} not found`);
      return;
    }

    // Check email uniqueness if updating email
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({
        where: { email: email.toLowerCase(), id: { [Op.ne]: id } },
      });
      if (emailExists) {
        sendResponse(res, StatusCodes.CONFLICT, false, 'Email address is already in use by another account');
        return;
      }
    }

    const updateData: Partial<UserAttributes> = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();

    await user.update(updateData);
    await user.reload();

    sendResponse(res, StatusCodes.OK, true, 'User updated successfully', user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /users/:id ────────────────────────────────────────────────────────

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params['id'], 10);

    const user = await User.findByPk(id);
    if (!user) {
      sendResponse(res, StatusCodes.NOT_FOUND, false, `User with ID ${id} not found`);
      return;
    }

    // Soft delete — set isActive = false
    await user.update({ isActive: false });

    sendResponse(res, StatusCodes.OK, true, 'User deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /users/:id/hard ───────────────────────────────────────────────────

export const hardDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params['id'], 10);

    const user = await User.findByPk(id);
    if (!user) {
      sendResponse(res, StatusCodes.NOT_FOUND, false, `User with ID ${id} not found`);
      return;
    }

    await user.destroy();

    sendResponse(res, StatusCodes.OK, true, 'User permanently deleted', { id });
  } catch (error) {
    next(error);
  }
};
