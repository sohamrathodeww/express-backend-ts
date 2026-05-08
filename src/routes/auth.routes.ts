import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/user.controller';
import { registerValidator, loginValidator } from '../validators/user.validator';
import { handleValidationErrors } from '../middlewares/errorHandler';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { firstName, lastName, email }
 */
router.post('/register', registerValidator, handleValidationErrors, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email only (no password)
 * @access  Public
 * @body    { email }
 */
router.post('/login', loginValidator, handleValidationErrors, loginUser);

export default router;
