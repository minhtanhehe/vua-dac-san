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
      console.log(`Connecting to RabbitMQ: ${rabbitmqUrl} (Attempt ${retries + 1}/${maxRetries})`);
      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();
      
      console.log('Connected to RabbitMQ successfully!');
      
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

  console.warn('RabbitMQ is not available. Running service without message queue capabilities.');
  return null;
}

export function getChannel() {
  return channel;
}

export function getConnection() {
  return connection;
}
