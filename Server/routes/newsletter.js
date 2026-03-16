import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import Game from '../models/Game.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const newsletterLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many subscription attempts. Please wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const subscribeValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('consentGiven').isBoolean().withMessage('Consent is required.'),
  body('sourcePage').optional().trim().isLength({ max: 300 }),
  body('subscribedGame').optional().trim().isLength({ max: 120 }),
  body('subscribedGameId').optional().trim().isLength({ max: 120 }),
];

const extractGameIdFromSourcePage = (sourcePage) => {
  if (!sourcePage) {
    return '';
  }

  try {
    const url = new URL(sourcePage);
    return (url.searchParams.get('id') || '').trim();
  } catch {
    return '';
  }
};

const resolveSubscribedGame = async (subscribedGameId, fallbackTitle = '') => {
  if (!subscribedGameId) {
    return fallbackTitle || '';
  }

  try {
    const game = await Game.findById(subscribedGameId).select('title').lean();
    return (game?.title || fallbackTitle || '').trim();
  } catch {
    return (fallbackTitle || '').trim();
  }
};

router.post('/', newsletterLimiter, subscribeValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    if (!req.body.consentGiven) {
      return res.status(400).json({ error: 'Consent is required to subscribe.' });
    }

    const sourcePage = req.body.sourcePage || '';
    const subscribedGameId = req.body.subscribedGameId || extractGameIdFromSourcePage(sourcePage);
    const subscribedGame = await resolveSubscribedGame(subscribedGameId, req.body.subscribedGame || '');

    const payload = {
      email: req.body.email,
      consentGiven: Boolean(req.body.consentGiven),
      sourcePage,
      subscribedGame,
      subscribedGameId,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    };

    const existing = await NewsletterSubscriber.findOne({ email: payload.email });
    if (existing) {
      if (payload.subscribedGame && !existing.subscribedGame) {
        existing.subscribedGame = payload.subscribedGame;
      }
      if (payload.subscribedGameId && !existing.subscribedGameId) {
        existing.subscribedGameId = payload.subscribedGameId;
      }
      if (payload.sourcePage && !existing.sourcePage) {
        existing.sourcePage = payload.sourcePage;
      }
      await existing.save();

      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: payload.subscribedGame
          ? `You are already subscribed for ${payload.subscribedGame}.`
          : 'This email is already subscribed.',
      });
    }

    const saved = await NewsletterSubscriber.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Thanks for subscribing to Rababa updates.',
      id: saved._id,
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
});

router.get('/admin/all', protect, async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 }).limit(2000);
    return res.json(subscribers);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
