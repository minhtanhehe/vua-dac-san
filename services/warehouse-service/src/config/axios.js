import axios from 'axios';
import 'dotenv/config';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8001';
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8003';

export const authApi = axios.create({
  baseURL: authServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const productApi = axios.create({
  baseURL: productServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log(`Internal service clients configured in Warehouse Service: Auth -> ${authServiceUrl}, Product -> ${productServiceUrl}`);
