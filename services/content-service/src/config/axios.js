import axios from 'axios';
import 'dotenv/config';

const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:8001';
const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:8004';

export const authApi = axios.create({
  baseURL: authServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const orderApi = axios.create({
  baseURL: orderServiceUrl,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log(`Internal service clients configured in Content Service: Auth -> ${authServiceUrl}, Order -> ${orderServiceUrl}`);
