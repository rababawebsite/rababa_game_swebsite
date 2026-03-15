import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import SuperAdmin from './models/SuperAdmin.js';
import Game from './models/Game.js';

// Try loading .env from project root first, then fallback to Server/.env
const rootEnvPath = path.resolve(process.cwd(), '.env');
const serverEnvPath = path.resolve(process.cwd(), 'Server', '.env');
dotenv.config({ path: rootEnvPath });
if (!process.env.MONGODB_URI) {
  // fallback
  dotenv.config({ path: serverEnvPath });
}

// Debug info to help identify where envs were loaded from
console.log('ENV load check — cwd:', process.cwd());
console.log('MONGODB_URI present?', !!process.env.MONGODB_URI);

// ------------------------
// Helper: Check required env vars
// ------------------------
const requiredEnv = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_USERNAME'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
const shouldForceReset = String(process.env.FORCE_ADMIN_RESET || 'false').toLowerCase() === 'true';

if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Checked paths:', rootEnvPath, serverEnvPath);
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
  console.error('❌ Missing admin password seed value. Provide ADMIN_PASSWORD or ADMIN_PASSWORD_HASH.');
  process.exit(1);
}

// ------------------------
// Connect to MongoDB
// ------------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// ------------------------
// Seed Super Admin
// ------------------------
const seedSuperAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@placeholder.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'SuperAdmin';

    let hashedPassword = process.env.ADMIN_PASSWORD_HASH || '';
    let generated = false;
    let generatedPassword = '';

    if (!hashedPassword) {
      let adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        adminPassword = crypto.randomBytes(8).toString('hex');
        generated = true;
        generatedPassword = adminPassword;
      }
      hashedPassword = await bcrypt.hash(adminPassword, 10);
    }

    const existingAdmin = await SuperAdmin.findOne();
    if (!existingAdmin) {
      const admin = await SuperAdmin.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword
      });

      console.log('✅ Super Admin created:', {
        username: admin.username,
        email: admin.email
      });

      if (generated) {
        console.log('⚠️ No ADMIN_PASSWORD env var found — a password was generated for the Super Admin.');
        console.log('Store this password securely; it will not be shown again:');
        console.log(`Generated SuperAdmin password: ${generatedPassword}`);
      }

      return admin;
    } else if (shouldForceReset) {
      existingAdmin.username = adminUsername;
      existingAdmin.email = adminEmail;
      existingAdmin.password = hashedPassword;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = null;
      existingAdmin.refreshToken = null;
      existingAdmin.sessionId = null;
      existingAdmin.lastActivity = null;
      await existingAdmin.save();

      console.log('✅ Super Admin reset using environment values:', {
        username: existingAdmin.username,
        email: existingAdmin.email
      });

      if (generated) {
        console.log('⚠️ Admin password was generated during reset:');
        console.log(`Generated SuperAdmin password: ${generatedPassword}`);
      }

      return existingAdmin;
    } else {
      console.log('ℹ️ Super Admin already exists:', {
        username: existingAdmin.username,
        email: existingAdmin.email
      });

      return existingAdmin;
    }
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    process.exit(1);
  }
};

// ------------------------
// Seed Hajwala Game
// ------------------------
const seedHajwalaGame = async () => {
  const hajwalaPayload = {
    title: 'HAJWALA: Drift Revolution',
    category: 'Sports',
    shortDescription: 'A free-to-play racing sensation with immersive drift physics, high-quality graphics, and nonstop adrenaline across mobile and PlayStation.',
    description: 'Hajwala, the sensational racing game by Rababa Games, took the MENA region by storm since its 2016 launch. With high-quality graphics and immersive physics, it is a thrilling free-to-play experience on iOS and Android. Boasting over 120 million downloads and 500,000 copies sold on PS stores, Hajwala stands as a mobile gaming triumph, continuously updated with new tracks and features for an adrenaline-pumping experience. Get ready for the ultimate racing thrill.',
    image: 'images/game-img.webp',
    thumbnail: 'images/game-img.webp',
    platforms: ['Google Play (Android)', 'App Store (Apple)', 'Huawei Store', 'PS4/PS5'],
    links: {
      googlePlay: 'https://play.google.com/store/apps/details?id=com.rababagames.hajwalah&hl=ar&gl=US&pli=1',
      appStore: 'https://apps.apple.com/kw/app/hajwala-drift/id1070657319?l=ar&platform=ipad',
      huaweiStore: 'https://appgallery.huawei.com/app/C100487857',
      ps: 'https://store.playstation.com/ar-kw/product/EP3334-CUSA11340_00-RG2017XX2018RG18',
      amazonAppStore: '',
      xbox: '',
      nintendoSwitch: '',
      steam: '',
      epicStore: ''
    },
    trailerUrl: '',
    featured: true,
    isNewRelease: false,
    isActive: true,
    order: 1,
    releaseDate: new Date('2016-01-01')
  };

  const existing = await Game.findOne({ title: hajwalaPayload.title });
  if (!existing) {
    const created = await Game.create(hajwalaPayload);
    console.log('✅ Hajwala game seeded:', { id: created._id, title: created.title });
    return created;
  }

  Object.assign(existing, hajwalaPayload);
  await existing.save();
  console.log('ℹ️ Hajwala game already existed, updated record:', { id: existing._id, title: existing.title });
  return existing;
};

// ------------------------
// Run Seeder
// ------------------------
const seedDatabase = async () => {
  await connectDB();
  const admin = await seedSuperAdmin();
  const game = await seedHajwalaGame();

  console.log('\n🎉 Database seeding complete!');
  console.log(`🔐 Super Admin Login: ${admin.email}`);
  console.log(`🏎️ Seeded Game: ${game.title}`);
  process.exit(0);
};

seedDatabase();
