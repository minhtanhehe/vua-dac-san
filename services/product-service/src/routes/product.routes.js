import express from 'express';
import multer from 'multer';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate, requireWarehouseRole } from '../middlewares/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- PUBLIC ROUTES ---
router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);

// --- PROTECTED ROUTES ---
// Requires authentication and KHO or QUAN_LY role
router.get('/expiry-warning', authenticate, requireWarehouseRole, ProductController.getExpiryWarning);
router.post('/upload', authenticate, requireWarehouseRole, upload.single('image'), ProductController.uploadImage);
router.post('/', authenticate, requireWarehouseRole, ProductController.createProduct);
router.put('/:id', authenticate, requireWarehouseRole, ProductController.updateProduct);
router.delete('/:id', authenticate, requireWarehouseRole, ProductController.deleteProduct);

// Public product detail
router.get('/:id', ProductController.getProductById);

// --- INTERNAL ROUTES (Service-to-service) ---
// Exposed internally, does not require token verification (called directly from order/warehouse service inside Docker network)
router.patch('/:id/stock', ProductController.updateStock);
router.post('/reserve-stock', ProductController.reserveStock);

export default router;
