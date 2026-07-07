import express from 'express';
import 'dotenv/config';
import financeRoutes from './routes/finance.routes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8006;

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
      service: 'finance-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'finance-service', 
      database: err.message
    });
  }
});

// Routes
// Note: Nginx API Gateway routes /api/finance/* to finance-service /*
app.use('/', financeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống trong Finance Service'
  });
});

async function startServer() {
  // Connect to RabbitMQ asynchronously (starts consumers inside connectRabbitMQ)
  connectRabbitMQ().catch((err) => {
    console.error('Error connecting to RabbitMQ in Finance Service at startup:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`Finance service is running on port ${PORT}`);
  });
}

startServer();
