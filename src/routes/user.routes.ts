import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  hardDeleteUser,
} from '../controllers/user.controller';
import {
  idParamValidator,
  listUsersValidator,
  updateUserValidator,
} from '../validators/user.validator';
import { handleValidationErrors } from '../middlewares/errorHandler';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Get all active users with pagination, search & sort
 * @access  Public
 * @query   page, limit, search, sortBy, sortOrder
 */
router.get('/', listUsersValidator, handleValidationErrors, listUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Public
 */
router.get('/:id', idParamValidator, handleValidationErrors, getUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID (partial or full update)
 * @access  Public
 * @body    { firstName?, lastName?, email? }
 */
router.put('/:id', updateUserValidator, handleValidationErrors, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft-delete user (sets isActive = false)
 * @access  Public
 */
router.delete('/:id', idParamValidator, handleValidationErrors, deleteUser);

/**
 * @route   DELETE /api/users/:id/hard
 * @desc    Permanently remove user from database
 * @access  Public
 */
router.delete('/:id/hard', idParamValidator, handleValidationErrors, hardDeleteUser);

export default router;
