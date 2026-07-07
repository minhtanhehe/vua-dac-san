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
      console.log(`Connecting to RabbitMQ in Order Service: ${rabbitmqUrl} (Attempt ${retries + 1}/${maxRetries})`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      
      console.log('Connected to RabbitMQ in Order Service!');
      
      // Declare queues
      await channel.assertQueue('user.otp.requested', { durable: true });
      await channel.assertQueue('order.completed', { durable: true });
      
      connection.on('close', () => {
        console.error('RabbitMQ connection closed! Reconnecting...');
        setTimeout(connectRabbitMQ, 5000);
      });

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error in Order Service', err);
      });

      return { connection, channel };
    } catch (err) {
      retries++;
      console.error(`Failed to connect to RabbitMQ in Order Service: ${err.message}. Retrying in 5 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.warn('RabbitMQ is not available. Running Order Service without message queue integration.');
  return null;
}

export async function publishOtpRequest(email, hoTen) {
  if (!channel) {
    console.error('RabbitMQ channel is not initialized. Cannot publish OTP request.');
    return false;
  }

  const queue = 'user.otp.requested';
  const payload = JSON.stringify({ email, hoTen });
  channel.sendToQueue(queue, Buffer.from(payload), { persistent: true });
  console.log(`[RabbitMQ] Published OTP request:`, { email, hoTen });
  return true;
}

export async function publishOrderCompleted(maHoadon, tongTienTT) {
  if (!channel) {
    console.error('RabbitMQ channel is not initialized. Cannot publish order completed.');
    return false;
  }

  const queue = 'order.completed';
  const payload = JSON.stringify({ maHoadon, tongTienTT });
  channel.sendToQueue(queue, Buffer.from(payload), { persistent: true });
  console.log(`[RabbitMQ] Published order completed event:`, { maHoadon, tongTienTT });
  return true;
}

export function getChannel() {
  return channel;
}
