import express from 'express';
import 'dotenv/config';
import contentRoutes from './routes/content.routes.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 8007;

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
      service: 'content-service', 
      database: 'connected'
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      service: 'content-service', 
      database: err.message
    });
  }
});

// Routes
// Note: Nginx API Gateway routes /api/content/* to content-service /*
app.use('/', contentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống trong Content Service'
  });
});

app.listen(PORT, () => {
  console.log(`Content service is running on port ${PORT}`);
});
