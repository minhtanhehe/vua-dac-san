import amqp from 'amqplib';
import 'dotenv/config';
import { ProductModel } from '../models/product.model.js';

let channel = null;
let connection = null;

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

export async function connectRabbitMQ() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Connecting to RabbitMQ: ${rabbitmqUrl} (Attempt ${retries + 1}/${maxRetries})`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      
      console.log('Connected to RabbitMQ in Product Service!');
      
      // Setup queues and consumers
      await setupQueuesAndConsumers();

      connection.on('close', () => {
        console.error('RabbitMQ connection closed! Reconnecting...');
        setTimeout(connectRabbitMQ, 5000);
      });

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error', err);
      });

      return { connection, channel };
    } catch (err) {
      retries++;
      console.error(`Failed to connect to RabbitMQ: ${err.message}. Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.warn('RabbitMQ is not available. Running Product Service without message queue integration.');
  return null;
}

async function setupQueuesAndConsumers() {
  if (!channel) return;

  // 1. Declare stock update queue (incoming)
  const stockUpdateQueue = 'warehouse.stock.updated';
  await channel.assertQueue(stockUpdateQueue, { durable: true });
  console.log(`Queue declared: ${stockUpdateQueue}`);

  // 2. Declare product expiry warning queue (outgoing)
  const expiryWarningQueue = 'product.expiry.warning';
  await channel.assertQueue(expiryWarningQueue, { durable: true });
  console.log(`Queue declared: ${expiryWarningQueue}`);

  // 3. Start consuming stock updates
  channel.consume(stockUpdateQueue, async (msg) => {
    if (!msg) return;

    try {
      const eventData = JSON.parse(msg.content.toString());
      console.log(`[RabbitMQ] Received stock update event:`, eventData);

      const { maSanpham, soLuongThayDoi } = eventData;
      if (!maSanpham || soLuongThayDoi === undefined) {
        console.error('Invalid event data format');
        channel.ack(msg);
        return;
      }

      // Update quantity in database
      const result = await ProductModel.updateStockInternal(maSanpham, soLuongThayDoi);
      if (result) {
        console.log(`[RabbitMQ] Updated stock for product ${maSanpham}: ${result.soLuongTon}`);
      } else {
        console.warn(`[RabbitMQ] Product ${maSanpham} not found during stock update`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('Error processing stock update event:', err.message);
      // Re-queue only if it's a temporary issue, else reject
      // Here, reject and don't re-queue to prevent infinite loops on JSON parsing error
      channel.nack(msg, false, false);
    }
  });
}

// Publish function to send expiry alerts
export async function publishExpiryWarning(data) {
  if (!channel) {
    console.error('RabbitMQ channel is not initialized. Cannot publish expiry warning.');
    return false;
  }

  const queue = 'product.expiry.warning';
  const payload = JSON.stringify(data);
  channel.sendToQueue(queue, Buffer.from(payload), { persistent: true });
  console.log(`[RabbitMQ] Published expiry warning:`, data);
  return true;
}

export function getChannel() {
  return channel;
}
