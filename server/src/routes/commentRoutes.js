import { Router } from 'express';
import { toggleCommentUpvote } from '../controllers/commentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.patch('/:id/upvote', requireAuth, toggleCommentUpvote);

export default router;
