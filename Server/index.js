import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Configure dotenv FIRST before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('📁 Environment loaded. ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

const DEFAULT_FRONTEND_URL = 'https://rababa-game-swebsite.vercel.app';
const DEFAULT_DASHBOARD_URL = 'https://rababa-game-swebsite-4nn9.vercel.app';

let connectionListenersAttached = false;
let databaseConnectionPromise = null;
let appPromise = null;

const connectToDatabase = async (mongoose) => {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not configured. Database-backed routes will fail until it is set.');
    return;
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectionListenersAttached) {
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error (event):', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    connectionListenersAttached = true;
  }

  if (!databaseConnectionPromise) {
    const mongooseOptions = {
      serverSelectionTimeoutMS: 30000,
    };

    databaseConnectionPromise = mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
      .then(() => {
        console.log('✅ Connected to MongoDB');
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        databaseConnectionPromise = null;
      });
  }

  await databaseConnectionPromise;
};

// Now dynamically import everything else AFTER env is loaded
async function createApp() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const mongoose = (await import('mongoose')).default;
  const helmet = (await import('helmet')).default;
  const rateLimit = (await import('express-rate-limit')).default;
  const mongoSanitize = (await import('express-mongo-sanitize')).default;
  const hpp = (await import('hpp')).default;

  // Routes - dynamically imported AFTER env vars are set
  const gameRoutes = (await import('./routes/games.js')).default;
  const uploadRoutes = (await import('./routes/upload.js')).default;
  const authRoutes = (await import('./routes/auth.js')).default;
  const platformLinksRoutes = (await import('./routes/platformLinks.js')).default;
  const contactRoutes = (await import('./routes/contact.js')).default;
  const newsletterRoutes = (await import('./routes/newsletter.js')).default;
  const sitemapRoutes = (await import('./routes/sitemap.js')).default;

  const app = express();
  const PORT = process.env.PORT || 5000;

  // ============ SECURITY MIDDLEWARE ============

  // Set security HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting - general API
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per 15 minutes
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // CORS configuration: allow production origins plus common localhost origins
  const prodOrigins = [
    DEFAULT_FRONTEND_URL,
    DEFAULT_DASHBOARD_URL,
    process.env.FRONTEND_URL,
    process.env.DASHBOARD_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean));
  const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  const whitelist = new Set(localOrigins.concat(prodOrigins));

  const corsOptions = {
    origin: (origin, callback) => {
      // allow non-browser tools like curl/postman (no origin)
      if (!origin) return callback(null, true);
      if (whitelist.has(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  console.log('CORS whitelist:', Array.from(whitelist));

  // Body parser with size limit
  app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Data sanitization against NoSQL injection
  app.use(mongoSanitize());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Apply general rate limiter to all routes
  app.use('/api', generalLimiter);

  // Apply strict rate limiter to auth routes
  app.use('/api/auth/login', authLimiter);

  connectToDatabase(mongoose).catch((err) => {
    console.error('Initial database connection attempt failed:', err);
  });

  // ============ ROUTES ============

  // Root route for Vercel health check
  app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Game Ads API Server', version: '1.0.0' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/platform-links', platformLinksRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/newsletter', newsletterRoutes);
  // Serve dynamic sitemap generated from DB
  app.use('/', sitemapRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Game Ads API is running' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message 
    });
  });

  return app;
}

const getApp = async () => {
  if (!appPromise) {
    appPromise = createApp();
  }

  return appPromise;
};

const handler = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};

export default handler;

const isDirectRun = Boolean(process.argv[1]) && resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  getApp()
    .then((app) => {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch(console.error);
}
