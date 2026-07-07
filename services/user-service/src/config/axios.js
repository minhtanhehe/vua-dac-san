import axios from 'axios';
import 'dotenv/config';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8001';
const warehouseServiceUrl = process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-service:8005';

export const authApi = axios.create({
  baseURL: authServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const warehouseApi = axios.create({
  baseURL: warehouseServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log(`Internal service clients configured: Auth -> ${authServiceUrl}, Warehouse -> ${warehouseServiceUrl}`);
