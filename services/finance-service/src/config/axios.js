import axios from 'axios';
import 'dotenv/config';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8001';
const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:8004';
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8003';
const warehouseServiceUrl = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-service:8005';
const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:8002';

export const authApi = axios.create({
  baseURL: authServiceUrl,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export const orderApi = axios.create({
  baseURL: orderServiceUrl,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export const productApi = axios.create({
  baseURL: productServiceUrl,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export const warehouseApi = axios.create({
  baseURL: warehouseServiceUrl,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export const userApi = axios.create({
  baseURL: userServiceUrl,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

console.log(`Internal service clients configured in Finance Service: Auth -> ${authServiceUrl}, Order -> ${orderServiceUrl}, Product -> ${productServiceUrl}, Warehouse -> ${warehouseServiceUrl}, User -> ${userServiceUrl}`);
