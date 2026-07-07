import express from 'express';
import 'dotenv/config';
import customerRoutes from './routes/customer.routes.js';
import orderRoutes from './routes/order.routes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8004;

app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check DB health
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      service: 'order-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'order-service', 
      database: err.message
    });
  }
});

// Routes
// Note: Nginx API Gateway routes /api/orders/* to order-service /*
app.use('/customers', customerRoutes);
app.use('/', orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống trong Order Service'
  });
});

async function startServer() {
  // Connect to RabbitMQ asynchronously
  connectRabbitMQ().catch((err) => {
    console.error('Error connecting to RabbitMQ in Order Service at startup:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`Order service is running on port ${PORT}`);
  });
}

startServer();
