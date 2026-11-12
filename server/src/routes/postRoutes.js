import { Router } from 'express';
import {
  addComment,
  createPost,
  deletePost,
  getPost,
  listPosts,
  togglePostUpvote,
  toggleResolved,
} from '../controllers/postController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, listPosts);
router.post('/', requireAuth, createPost);
router.get('/:id', optionalAuth, getPost);
router.patch('/:id/upvote', requireAuth, togglePostUpvote);
router.patch('/:id/resolve', requireAuth, toggleResolved);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/comments', requireAuth, addComment);

export default router;
