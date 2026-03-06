import { Router } from 'express';

// Controllers
import * as postController from '../controllers/post.js';

const router = Router();

router.post('/', postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.patch('/:id', postController.updatePost);

export default router;
