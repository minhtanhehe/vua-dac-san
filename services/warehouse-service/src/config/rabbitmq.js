import amqp from 'amqplib';
import 'dotenv/config';

let channel = null;
let connection = null;

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

export async function connectRabbitMQ() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Connecting to RabbitMQ in Warehouse Service: ${rabbitmqUrl} (Attempt ${retries + 1}/${maxRetries})`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      
      console.log('Connected to RabbitMQ in Warehouse Service!');
      
      // Declare queues
      await channel.assertQueue('warehouse.stock.updated', { durable: true });
      await channel.assertQueue('warehouse.invoice.created', { durable: true });
      
      connection.on('close', () => {
        console.error('RabbitMQ connection closed! Reconnecting...');
        setTimeout(connectRabbitMQ, 5000);
      });

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error in Warehouse Service', err);
      });

      return { connection, channel };
    } catch (err) {
      retries++;
      console.error(`Failed to connect to RabbitMQ in Warehouse Service: ${err.message}. Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.warn('RabbitMQ is not available. Running Warehouse Service without message queue integration.');
  return null;
}

export async function publishStockUpdate(maSanpham, soLuongThayDoi) {
  if (!channel) {
    console.error('RabbitMQ channel is not initialized. Cannot publish stock update.');
    return false;
  }

  const queue = 'warehouse.stock.updated';
  const payload = JSON.stringify({ maSanpham, soLuongThayDoi });
  channel.sendToQueue(queue, Buffer.from(payload), { persistent: true });
  console.log(`[RabbitMQ] Published stock update:`, { maSanpham, soLuongThayDoi });
  return true;
}

export async function publishInvoiceCreated(maPhieu, tongTien, maNCC) {
  if (!channel) {
    console.error('RabbitMQ channel is not initialized. Cannot publish invoice creation.');
    return false;
  }

  const queue = 'warehouse.invoice.created';
  const payload = JSON.stringify({ maPhieu, tongTien, maNCC });
  channel.sendToQueue(queue, Buffer.from(payload), { persistent: true });
  console.log(`[RabbitMQ] Published invoice created:`, { maPhieu, tongTien, maNCC });
  return true;
}

export function getChannel() {
  return channel;
}
