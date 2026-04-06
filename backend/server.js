import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import adminAuthRoutes from './routes/adminAuth.js';
import authRoutes from './routes/auth.js';
import customerProductsRoutes from './routes/customerProducts.js';
import customerRoutes from './routes/customers.js';
import distributorAuthRoutes from './routes/distributorAuth.js';
import distributorsRoutes from './routes/distributors.js';
import inventoryProductsRoutes from './routes/inventoryProducts.js';
import retailerProductsRoutes from './routes/retailerProducts.js';
import restockRequestsRoutes from './routes/restockRequests.js';
import serviceRequestsRoutes from './routes/serviceRequests.js';
import retailerAuthRoutes from './routes/retailerAuth.js';
import retailersRoutes from './routes/retailers.js';
import subAdminAuthRoutes from './routes/subAdminAuth.js';
import subAdminsRoutes from './routes/subadmins.js';
import uploadsRoutes from './routes/uploads.js';
import { syncAdminAccount } from './utils/seedAdmin.js';
import { syncInventoryProductsCatalog } from './utils/seedInventoryProducts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const parsedPort = Number.parseInt(process.env.PORT || '5000', 10);
const port = Number.isFinite(parsedPort) ? parsedPort : 5000;
const host = process.env.HOST || '0.0.0.0';
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

const isAllowedLanOrigin = (origin) =>
  /^https?:\/\/((localhost|127\.0\.0\.1)|((192\.168|10)\.\d+\.\d+\.\d+)|(172\.(1[6-9]|2\d|3[01])\.\d+\.\d+))(?::\d+)?$/i.test(
    origin,
  );

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin) || isAllowedLanOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  }),
);
app.use(express.json());

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

app.get('/', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Kitchen Appliance backend is running.',
  });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Backend is healthy.',
    databaseState: mongoose.connection.readyState,
  });
});

app.use('/api/admin', adminAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customer-products', customerProductsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/distributor', distributorAuthRoutes);
app.use('/api/distributors', distributorsRoutes);
app.use('/api/inventory-products', inventoryProductsRoutes);
app.use('/api/retailer-products', retailerProductsRoutes);
app.use('/api/restock-requests', restockRequestsRoutes);
app.use('/api/service-requests', serviceRequestsRoutes);
app.use('/api/retailer', retailerAuthRoutes);
app.use('/api/retailers', retailersRoutes);
app.use('/api/subadmin', subAdminAuthRoutes);
app.use('/api/subadmins', subAdminsRoutes);
app.use('/api/uploads', uploadsRoutes);

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api).*/, (_request, response) => {
    response.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

const startServer = async () => {
  try {
    await connectDatabase();
    const admin = await syncAdminAccount();
    await syncInventoryProductsCatalog();

    console.log(`Admin account synced to database: ${admin.email}`);

    app.listen(port, host, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Server listening on http://${host}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
