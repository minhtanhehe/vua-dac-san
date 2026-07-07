import amqp from 'amqplib';
import 'dotenv/config';
import pool from './db.js';

let channel = null;
let connection = null;

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

export async function connectRabbitMQ() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Connecting to RabbitMQ in Finance Service: ${rabbitmqUrl} (Attempt ${retries + 1}/${maxRetries})`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      
      console.log('Connected to RabbitMQ in Finance Service!');
      
      // Declare queues
      await channel.assertQueue('warehouse.invoice.created', { durable: true });
      await channel.assertQueue('order.completed', { durable: true });

      // Start consuming events
      startConsumers();
      
      connection.on('close', () => {
        console.error('RabbitMQ connection closed! Reconnecting...');
        setTimeout(connectRabbitMQ, 5000);
      });

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error in Finance Service', err);
      });

      return { connection, channel };
    } catch (err) {
      retries++;
      console.error(`Failed to connect to RabbitMQ in Finance Service: ${err.message}. Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.warn('RabbitMQ is not available. Running Finance Service without message queue integration.');
  return null;
}

function startConsumers() {
  if (!channel) return;

  // 1. Consume warehouse.invoice.created
  channel.consume('warehouse.invoice.created', async (msg) => {
    if (msg !== null) {
      try {
        const eventData = JSON.parse(msg.content.toString());
        console.log('[RabbitMQ] Consumed warehouse.invoice.created event:', eventData);

        const { maPhieu, tongTien, maNCC } = eventData;
        
        // Auto create THANH_TOAN_HOA_DON_KHO record
        const query = `
          INSERT INTO THANH_TOAN_HOA_DON_KHO (maPhieuKho, soTien, phuongThuc, ghiChu)
          VALUES ($1, $2, null, $3)
          RETURNING *
        `;
        const note = `Tao tu dong tu phieu nhap kho cua NCC: ${maNCC || 'N/A'}`;
        const result = await pool.query(query, [maPhieu, tongTien, note]);
        
        console.log('[RabbitMQ] Successfully created pending payment record:', result.rows[0]);
        
        channel.ack(msg);
      } catch (err) {
        console.error('[RabbitMQ] Error processing warehouse.invoice.created event:', err.message);
        // Requeue message if transient error
        channel.nack(msg, false, true);
      }
    }
  });

  // 2. Consume order.completed
  channel.consume('order.completed', (msg) => {
    if (msg !== null) {
      try {
        const eventData = JSON.parse(msg.content.toString());
        console.log('[RabbitMQ] Consumed order.completed event (Ghi nhan doanh thu):', eventData);

        const { maHoadon, tongTienTT } = eventData;
        console.log(`[RabbitMQ] Record revenue: Order ${maHoadon} completed successfully with total amount: ${tongTienTT} VND`);

        channel.ack(msg);
      } catch (err) {
        console.error('[RabbitMQ] Error processing order.completed event:', err.message);
        channel.nack(msg, false, true);
      }
    }
  });
}

export function getChannel() {
  return channel;
}
