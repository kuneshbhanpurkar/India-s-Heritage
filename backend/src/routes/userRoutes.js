import { Router } from 'express';
import { getCurrentUser, loginUser, registerUser, updateCurrentUser } from '../controllers/userController.js';
import { requireUserToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/me', requireUserToken, getCurrentUser);
router.put('/me', requireUserToken, updateCurrentUser);

export default router;
