import express from 'express';
import 'dotenv/config';
import productRoutes from './routes/product.routes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { initCronJobs } from './config/cron.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8003;

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
      service: 'product-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'product-service', 
      database: err.message
    });
  }
});

// Mount routes at root because Nginx strips /api/products/ prefix
app.use('/', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống'
  });
});

async function startServer() {
  // Connect to RabbitMQ asynchronously (sets up consumers and queues)
  connectRabbitMQ().then(() => {
    // Initialize cron jobs after RabbitMQ is connected (or skipped)
    initCronJobs();
  }).catch(err => {
    console.error('Error connecting to RabbitMQ at startup:', err.message);
    initCronJobs();
  });

  app.listen(PORT, () => {
    console.log(`Product service is running on port ${PORT}`);
  });
}

startServer();
