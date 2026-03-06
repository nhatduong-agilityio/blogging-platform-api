import { Router } from 'express';

// Controllers
import * as postController from '../controllers/post.js';

const router = Router();

router.post('/', postController.createPost);

export default router;
