import express from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authenticate, requireWarehouseRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// --- INTERNAL ROUTES (Service-to-service) ---
// Exposed internally, does not require token verification
router.get('/suppliers/:id/has-transactions', InvoiceController.hasTransactions);
router.patch('/invoices/:id/payment-status', InvoiceController.updatePaymentStatus);

// --- PROTECTED ROUTES ---
router.use(authenticate);
router.use(requireWarehouseRole);

router.get('/invoices', InvoiceController.getInvoices);
router.get('/invoices/:id', InvoiceController.getInvoiceById);
router.post('/invoices/import', InvoiceController.createImportInvoice);
router.post('/invoices/export', InvoiceController.createExportInvoice);
router.put('/invoices/:id', InvoiceController.updateInvoice);
router.delete('/invoices/:id', InvoiceController.deleteInvoice);

export default router;
