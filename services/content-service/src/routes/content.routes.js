import express from 'express';
import { ContentController } from '../controllers/content.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- PUBLIC ROUTES (No Token Required) ---
router.get('/posts', ContentController.getPublicPosts);

// --- PROTECTED ROUTE (Placed before /posts/:id to avoid shadowing) ---
router.get('/posts/manage', authenticate, requireRole(['BAN_HANG', 'QUAN_LY']), ContentController.getManagePosts);

router.get('/posts/:id', ContentController.getPostById);
router.get('/categories', ContentController.getCategories);

router.post('/comments', ContentController.createComment);
router.post('/support-requests', ContentController.createSupportRequest);

// For testing / initial setup only
router.post('/categories', ContentController.createCategory);

// --- PROTECTED ROUTES ---
router.use(authenticate);

// Post Management (Sales / Manager)
router.post('/posts', requireRole(['BAN_HANG']), ContentController.createPost);
router.put('/posts/:id', requireRole(['BAN_HANG', 'QUAN_LY']), ContentController.updatePost);
router.patch('/posts/:id/status', requireRole(['QUAN_LY']), ContentController.updatePostStatus);
router.delete('/posts/:id', requireRole(['BAN_HANG', 'QUAN_LY']), ContentController.deletePost);

// Comment Moderation (CSKH)
router.get('/comments/pending', requireRole(['CSKH', 'QUAN_LY']), ContentController.getPendingComments);
router.patch('/comments/:id/approve', requireRole(['CSKH']), ContentController.approveComment);
router.patch('/comments/:id/hide', requireRole(['CSKH']), ContentController.hideComment);

// Support Request Resolution (CSKH)
router.get('/support-requests/me', requireRole(['KHACH_HANG']), ContentController.getMySupportRequests);
router.get('/support-requests', requireRole(['CSKH', 'QUAN_LY']), ContentController.getSupportRequests);
router.put('/support-requests/:id/reply', requireRole(['CSKH', 'QUAN_LY']), ContentController.replySupportRequest);

export default router;
