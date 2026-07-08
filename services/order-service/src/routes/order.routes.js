import express from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- INTERNAL API (Service-to-service) ---
router.get('/revenue', OrderController.getShiftRevenue);
router.get('/statistics/revenue', OrderController.getRevenueStatistics);
router.get('/statistics/top-selling', OrderController.getTopSellingProducts);
router.get('/:id/verify-internal', OrderController.verifyOrderInternal);

// --- PUBLIC API (No auth needed) ---
router.get('/promos/available', OrderController.getAvailablePromos);

// All routes require authentication
router.use(authenticate);

// List and Create
router.get('/', requireRole(['BAN_HANG', 'QUAN_LY', 'KHACH_HANG']), OrderController.getOrders);
router.post('/', requireRole(['BAN_HANG', 'KHACH_HANG']), OrderController.createOrder);

// Promotions CRUD (Admin only)
router.get('/promos', requireRole(['BAN_HANG', 'QUAN_LY', 'KE_TOAN']), OrderController.getAllPromos);
router.post('/promos', requireRole(['QUAN_LY', 'KE_TOAN']), OrderController.createPromo);
router.put('/promos/:code', requireRole(['QUAN_LY', 'KE_TOAN']), OrderController.updatePromo);
router.delete('/promos/:code', requireRole(['QUAN_LY']), OrderController.deletePromo);

// Detail, Status, Cancel, Invoice
router.get('/:id', requireRole(['BAN_HANG', 'QUAN_LY', 'KHACH_HANG']), OrderController.getOrderById);
router.patch('/:id/status', requireRole(['BAN_HANG', 'QUAN_LY', 'KHO']), OrderController.updateOrderStatus);
router.delete('/:id/cancel', requireRole(['BAN_HANG', 'QUAN_LY', 'KHACH_HANG']), OrderController.cancelOrder);
router.get('/:id/invoice', requireRole(['BAN_HANG', 'QUAN_LY', 'KHACH_HANG']), OrderController.getInvoice);

export default router;
