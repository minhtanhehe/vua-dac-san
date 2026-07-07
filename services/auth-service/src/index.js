import express from 'express';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8001;

// Trust Nginx reverse proxy - required for express-rate-limit to work correctly
app.set('trust proxy', 1);

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
      service: 'auth-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'auth-service', 
      database: err.message
    });
  }
});

// Mount routes at root because Nginx strips /api/auth/ prefix
app.use('/', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống'
  });
});

// Initialize dependencies and start server
async function startServer() {
  // Connect to RabbitMQ asynchronously (does not block startup if MQ is down)
  connectRabbitMQ().catch(err => {
    console.error('Error connecting to RabbitMQ at startup:', err.message);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth service is running on port ${PORT}`);
  });
}

startServer();
