import express from 'express';
import 'dotenv/config';
import userRoutes from './routes/user.routes.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8002;

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
      service: 'user-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'user-service', 
      database: err.message
    });
  }
});

// Mount routes at root because Nginx strips /api/users/ prefix
app.use('/', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống'
  });
});

app.listen(PORT, () => {
  console.log(`User service is running on port ${PORT}`);
});
