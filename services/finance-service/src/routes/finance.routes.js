import express from 'express';
import { FinanceController } from '../controllers/finance.controller.js';
import { authenticate, requireAccountant } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes in finance-service require authentication and accountant/manager access
router.use(authenticate);
router.use(requireAccountant);

// Payroll
router.get('/payroll', FinanceController.getPayroll);
router.post('/payroll', FinanceController.createPayroll);
router.put('/payroll/:id/confirm', FinanceController.confirmPayroll);

// Shift Settlement
router.post('/shift-settlement', FinanceController.settleShift);
router.get('/shift-settlement', FinanceController.getShiftSettlements);

// Warehouse Payments
router.get('/warehouse-payments', FinanceController.getWarehousePayments);
router.put('/warehouse-payments/:id/pay', FinanceController.payWarehouseInvoice);

// Statistics & Report
router.get('/statistics/revenue', FinanceController.getRevenueStatistics);
router.get('/statistics/export', FinanceController.exportExcel);

export default router;
