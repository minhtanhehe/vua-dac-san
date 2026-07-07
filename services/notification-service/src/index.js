import express from 'express';
import 'dotenv/config';
import notificationRoutes from './routes/notification.routes.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import redisClient from './config/redis.js';

const app = express();
const PORT = process.env.PORT || 8008;

app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check redis connection
    const redisPing = await redisClient.ping();
    res.json({ 
      status: 'ok', 
      service: 'notification-service', 
      redis: redisPing === 'PONG' ? 'connected' : 'disconnected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'notification-service', 
      redis: err.message
    });
  }
});

// Routes
// Note: Nginx API Gateway routes /api/notifications/* to notification-service /*
app.use('/', notificationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi hệ thống trong Notification Service'
  });
});

app.listen(PORT, async () => {
  console.log(`Notification service is running on port ${PORT}`);
  // Start consuming RabbitMQ messages
  await connectRabbitMQ();
});
