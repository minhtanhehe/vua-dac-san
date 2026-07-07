import express from 'express';
import { EmployeeController } from '../controllers/employee.controller.js';
import { SupplierController } from '../controllers/supplier.controller.js';
import { authenticate, requireManager } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes here require verification of token
router.use(authenticate);

// --- EMPLOYEE MANAGEMENT ROUTES ---
// Manager only
router.get('/employees', requireManager, EmployeeController.getEmployees);
router.post('/employees', requireManager, EmployeeController.createEmployee);
router.get('/employees/:id', requireManager, EmployeeController.getEmployeeById);
router.put('/employees/:id', requireManager, EmployeeController.updateEmployee);
router.put('/employees/:id/status', requireManager, EmployeeController.updateStatus);
router.get('/employees/:id/activity-log', requireManager, EmployeeController.getActivityLogs);
router.put('/employees/:id/permissions', requireManager, EmployeeController.updatePermissions);

// Manager or Self (auth logic inside controller)
router.get('/employees/:id/schedule', EmployeeController.getSchedule);

// --- SUPPLIER MANAGEMENT ROUTES ---
// All require role QUAN_LY (Manager)
router.get('/suppliers', requireManager, SupplierController.getSuppliers);
router.post('/suppliers', requireManager, SupplierController.createSupplier);
router.get('/suppliers/:id', requireManager, SupplierController.getSupplierById);
router.put('/suppliers/:id', requireManager, SupplierController.updateSupplier);
router.delete('/suppliers/:id', requireManager, SupplierController.deleteSupplier);

export default router;
