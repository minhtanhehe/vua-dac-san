import { createClient } from 'redis';
import 'dotenv/config';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const client = createClient({
  url: `redis://${redisHost}:${redisPort}`
});

client.on('error', (err) => console.error('Redis Client Error in Notification Service', err));
client.on('connect', () => console.log('Redis connected successfully in Notification Service'));

// Connect immediately
await client.connect();

export default client;
