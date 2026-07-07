import express from 'express';
import 'dotenv/config';
import invoiceRoutes from './routes/invoice.routes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8005;

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
      service: 'warehouse-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'warehouse-service', 
      database: err.message
    });
  }
});

// Routes
// Note: Nginx API Gateway routes /api/warehouse/* to warehouse-service /*
app.use('/', invoiceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống trong Warehouse Service'
  });
});

async function startServer() {
  // Connect to RabbitMQ asynchronously
  connectRabbitMQ().catch((err) => {
    console.error('Error connecting to RabbitMQ in Warehouse Service at startup:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`Warehouse service is running on port ${PORT}`);
  });
}

startServer();
