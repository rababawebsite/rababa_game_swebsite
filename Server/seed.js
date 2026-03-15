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
  const hajwalaHeroImage = 'https://image.api.playstation.com/vulcan/ap/rnd/202012/1315/W5jsEgKLxoizJj1AHPTgpinL.jpg?w=1920&thumb=false';
  const hajwalaScreenOne = 'https://image.api.playstation.com/vulcan/ap/rnd/202012/1509/VaKgh6BjZufI0yJPOWZFRQa2.jpg?w=440&thumb=false';
  const hajwalaScreenTwo = 'https://image.api.playstation.com/vulcan/ap/rnd/202012/1509/HQaEUzPcg1to5JSlNUpdOPMo.jpg?w=440&thumb=false';
  const hajwalaScreenThree = 'https://image.api.playstation.com/vulcan/ap/rnd/202012/1509/QyyDEoNgf96kJc9XqRQHcv6m.jpg?w=440&thumb=false';

  const hajwalaPageContent = {
    hero: {
      title: 'HAJWALA: Drift Revolution',
      description: 'The leading drifting and racing experience from Rababa Games, built around customization, social online play, open-road freedom, and a huge car culture audience across the Middle East.',
      buttonText: 'Play Hajwala',
      backgroundImage: hajwalaHeroImage
    },
    video: {
      src: '',
      poster: hajwalaHeroImage,
      embedUrl: 'https://www.youtube.com/watch?v=ZyreS5abIVk'
    },
    about: {
      heading: 'The Drift Phenomenon',
      paragraphs: [
        'Hajwala is Rababa Games\' flagship drifting and racing title, known for turning Gulf car culture into an accessible, social, and highly replayable driving game. Official store pages describe it as a leading racing and drifting game in the Middle East, focused on freedom, style, and player creativity.',
        'Across Android, iPhone, iPad, Huawei AppGallery, and PlayStation 4, Hajwala combines approachable controls with tuning depth, online sessions, varied environments, and a long-running update history. Google Play lists 50M+ downloads, while the official store copy highlights more than 100 million downloads worldwide.'
      ],
      bullets: [
        'Customize your car and your character',
        'Create and design your own tracks',
        'Drift online with up to 8 players',
        'Choose weather, day, and night conditions'
      ],
      backgroundImage: hajwalaScreenThree
    },
    features: [
      {
        title: 'Customize & Tune',
        description: 'Build a Hajwala setup that matches your own style with visual customization, tuning, and personalized design choices.',
        image: hajwalaScreenOne,
        alt: 'Hajwala customization and drift gameplay',
        modal: {
          title: 'Customization & Tuning',
          sectionOneTitle: 'Create Your Look',
          sectionOneText: 'Official store descriptions emphasize that you can customize both your car and your character to reflect your style. Hajwala is built around standing out with your own design instead of driving the same setup as everyone else.',
          sectionOneImage: hajwalaScreenOne,
          sectionOneAlt: 'Hajwala gameplay screenshot showing car customization atmosphere',
          sectionTwoTitle: 'Tune It Your Way',
          sectionTwoText: 'Rababa highlights the ability to tune the car the way you want, giving players control over how their ride feels and performs while drifting, cruising, or tackling different challenge types.',
          sectionTwoImage: hajwalaScreenTwo,
          sectionTwoAlt: 'Hajwala screenshot with high-speed road action'
        }
      },
      {
        title: 'Online With Friends',
        description: 'Take Hajwala online with up to 8 players at once and stay connected through voice and text chat during sessions.',
        image: hajwalaScreenTwo,
        alt: 'Hajwala online multiplayer racing scene',
        modal: {
          title: 'Online Multiplayer',
          sectionOneTitle: 'Up To 8 Players',
          sectionOneText: 'Google Play, App Store, AppGallery, and the PlayStation Store all point to Hajwala\'s social side. The game supports online play with up to eight players at the same time, giving drifting sessions a strong community feel.',
          sectionOneImage: hajwalaScreenTwo,
          sectionOneAlt: 'Hajwala multiplayer driving screenshot',
          sectionTwoTitle: 'Voice & Text Chat',
          sectionTwoText: 'The store copy specifically mentions built-in voice and text chat so you can stay close to your friends, coordinate online sessions, and keep the social energy of the game alive no matter the distance.',
          sectionTwoImage: hajwalaScreenThree,
          sectionTwoAlt: 'Hajwala action shot representing shared online play'
        }
      },
      {
        title: 'Many Modes, One Culture',
        description: 'Move between drifting, police chases, desert dune challenges, burnout events, and more without losing the core Hajwala identity.',
        image: hajwalaScreenThree,
        alt: 'Hajwala gameplay variety screenshot',
        modal: {
          title: 'Modes & Environments',
          sectionOneTitle: 'More Than Just Drifting',
          sectionOneText: 'Official descriptions mention a wide mix of gameplay modes and environments, including drifting, police chasing, off-road desert dunes, burnout challenges, and additional activities beyond the main driving loop.',
          sectionOneImage: hajwalaScreenThree,
          sectionOneAlt: 'Hajwala screenshot for multiple gameplay styles',
          sectionTwoTitle: 'Control The Atmosphere',
          sectionTwoText: 'Hajwala also lets players choose day or night time and adjust weather conditions, helping each session feel different while reinforcing the game\'s sandbox-style driving identity.',
          sectionTwoImage: hajwalaHeroImage,
          sectionTwoAlt: 'Hajwala hero artwork from official store media'
        }
      },
      {
        title: 'Big Garage, Broad Reach',
        description: 'With more than 100 car models and a major audience across mobile and console, Hajwala has become one of Rababa\'s most recognized racing experiences.',
        image: hajwalaHeroImage,
        alt: 'Hajwala key art',
        modal: {
          title: 'Scale & Popularity',
          sectionOneTitle: '100+ Car Models',
          sectionOneText: 'The official store pages repeatedly highlight the size of the Hajwala garage, with more than 100 car models available for players to choose from across its different modes and environments.',
          sectionOneImage: hajwalaScreenOne,
          sectionOneAlt: 'Hajwala screenshot representing its garage and car variety',
          sectionTwoTitle: 'Major Regional Success',
          sectionTwoText: 'Google Play lists 50M+ downloads and more than 1.17M reviews, while the official marketing copy states that Hajwala has surpassed 100 million downloads worldwide. On PlayStation 4, the game launched in April 2018 and supports Arabic and English on-screen text and audio.',
          sectionTwoImage: hajwalaScreenTwo,
          sectionTwoAlt: 'Hajwala screenshot reflecting the game\'s scale and platform reach'
        }
      }
    ],
    media: [
      { title: 'Official Key Art', url: hajwalaHeroImage, thumbnail: hajwalaHeroImage, alt: 'Hajwala official key art' },
      { title: 'PS4 Screenshot One', url: hajwalaScreenOne, thumbnail: hajwalaScreenOne, alt: 'Hajwala screenshot from PlayStation Store' },
      { title: 'PS4 Screenshot Two', url: hajwalaScreenTwo, thumbnail: hajwalaScreenTwo, alt: 'Hajwala drifting gameplay screenshot' },
      { title: 'PS4 Screenshot Three', url: hajwalaScreenThree, thumbnail: hajwalaScreenThree, alt: 'Hajwala official gameplay screenshot' }
    ],
    faq: [
      {
        question: 'What is Hajwala about?',
        answer: 'Hajwala is a racing and drifting game by Rababa Games focused on customization, online play, track creation, vehicle tuning, and a wide mix of driving challenges including drifting, police chases, dunes, and burnout-style events.'
      },
      {
        question: 'Which platforms support Hajwala?',
        answer: 'Official store listings show Hajwala on Android, iPhone, iPad, Huawei AppGallery, and PlayStation 4. Google Play also lists support through Google Play Games on PC for Windows.'
      },
      {
        question: 'Does Hajwala support multiplayer?',
        answer: 'Yes. The official store descriptions state that Hajwala supports online play with up to 8 players simultaneously, with voice and text chat available in online mode.'
      },
      {
        question: 'What makes Hajwala stand out?',
        answer: 'Its appeal comes from combining Gulf-region drifting culture with accessible driving, broad customization, a large car list, social online play, weather and time control, and long-running popularity across the region.'
      }
    ],
    dlc: [],
    cta: {
      lines: ['Start', 'Your', 'Drift'],
      buttonText: 'Get Hajwala',
      systemRequirementsTitle: 'PLATFORM DETAILS',
      backgroundImage: hajwalaScreenTwo
    },
    systemRequirements: {
      question: 'Where can I play Hajwala?',
      minimumTitle: 'Mobile & App Platforms',
      minimum: [
        'Android via Google Play',
        'iPhone and iPad via the App Store',
        'Huawei devices via AppGallery',
        'Free to play with in-app purchases on mobile storefronts'
      ],
      recommendedTitle: 'Console & Additional Availability',
      recommended: [
        'PlayStation 4 release date: 2018-04-10',
        'PlayStation Store publisher: RABABA DESIGN ESTABLISHMENT',
        'Google Play lists availability on Windows through Google Play Games on PC',
        'PS4 store listing notes optional online play with support for up to 8 players'
      ]
    },
    newsletter: {
      heading: 'Stay In The Drift',
      subHeading: 'Get Hajwala updates, improvements, and announcements from Rababa Games.',
      consentText: 'I agree to receive Hajwala news and accept the Privacy Policy.',
      infoText: 'You can unsubscribe at any time. For privacy details, review the Rababa Games privacy policy.',
      buttonText: 'Subscribe'
    },
    footer: {
      logo: '',
      ageRatingImage: '',
      copyrightText: 'HAJWALA by RABABA Games'
    }
  };

  const hajwalaPayload = {
    title: 'HAJWALA: Drift Revolution',
    category: 'Sports',
    shortDescription: 'Rababa Games\' flagship drifting racer with deep customization, huge car variety, online play for up to 8 players, and major popularity across mobile and PlayStation.',
    description: 'Hajwala is a long-running racing and drifting game from Rababa Games. Official store descriptions highlight car and character customization, custom track creation, tuning, multiple gameplay styles, and social online sessions with voice and text chat. The game is available across major mobile platforms and PlayStation 4, with Google Play listing 50M+ downloads and official store copy citing more than 100 million downloads worldwide.',
    image: hajwalaScreenOne,
    thumbnail: hajwalaScreenTwo,
    bannerImage: hajwalaHeroImage,
    galleryImages: [
      { url: hajwalaScreenOne, fileId: '', name: 'Hajwala Screenshot 1', thumbnailUrl: hajwalaScreenOne },
      { url: hajwalaScreenTwo, fileId: '', name: 'Hajwala Screenshot 2', thumbnailUrl: hajwalaScreenTwo },
      { url: hajwalaScreenThree, fileId: '', name: 'Hajwala Screenshot 3', thumbnailUrl: hajwalaScreenThree }
    ],
    platforms: ['Google Play (Android)', 'App Store (Apple)', 'Huawei Store', 'PS4/PS5'],
    links: {
      googlePlay: 'https://play.google.com/store/apps/details?id=com.rababagames.hajwalah&hl=en&gl=US',
      appStore: 'https://apps.apple.com/kw/app/hajwala-drift/id1070657319',
      huaweiStore: 'https://appgallery.huawei.com/app/C100487857',
      ps: 'https://store.playstation.com/ar-kw/product/EP3334-CUSA11340_00-RG2017XX2018RG18',
      amazonAppStore: '',
      xbox: '',
      nintendoSwitch: '',
      steam: '',
      epicStore: ''
    },
    trailerUrl: 'https://youtu.be/ZyreS5abIVk',
    pageContent: hajwalaPageContent,
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
