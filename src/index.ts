import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import sequelize from './config/db';

// Import all models to register them
import './models/User';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    // Sync models (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Models synced with database');
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ─────────────────────────────────────────────');
      console.log(`🚀  Express TypeScript API Server`);
      console.log(`🚀  Environment : ${process.env.NODE_ENV ?? 'development'}`);
      console.log(`🚀  Port        : ${PORT}`);
      console.log(`🚀  Base URL    : http://localhost:${PORT}/api`);
      console.log(`🚀  Health      : http://localhost:${PORT}/api/health`);
      console.log('🚀 ─────────────────────────────────────────────');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Promise Rejection:', reason.message);
  process.exit(1);
});

startServer();
