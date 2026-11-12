import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { startExpiryJob } from './cron/expiryJob.js';

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value with at least 32 characters.');
  }

  await connectDatabase();
  startExpiryJob();

  const server = app.listen(port, () => {
    console.log(`StackRoast API listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing HTTP server...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Unable to start StackRoast:', error.message);
  process.exit(1);
});
