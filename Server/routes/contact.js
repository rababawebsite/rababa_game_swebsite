import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import ContactMessage from '../models/ContactMessage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many contact requests. Please wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const validation = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Message must be 10-3000 characters.'),
  body('sourcePage').optional().trim().isLength({ max: 300 }),
];

router.post('/', contactLimiter, validation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const payload = {
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
      sourcePage: req.body.sourcePage || '',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    };

    const saved = await ContactMessage.create(payload);

    const transporter = createTransporter();
    if (transporter) {
      const to = process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL;
      const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

      if (to && from) {
        await transporter.sendMail({
          from,
          to,
          replyTo: payload.email,
          subject: `New Contact Message from ${payload.name}`,
          text: [
            `Name: ${payload.name}`,
            `Email: ${payload.email}`,
            `Source: ${payload.sourcePage}`,
            '',
            payload.message,
            '',
            `IP: ${payload.ipAddress}`,
            `User Agent: ${payload.userAgent}`,
          ].join('\n'),
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Thanks. Your message has been sent successfully.',
      id: saved._id,
    });
  } catch (error) {
    console.error('Contact submit error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

router.get('/admin/all', protect, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(500);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/admin/:id/status', protect, [
  body('status').isIn(['new', 'reviewed', 'resolved']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid status', details: errors.array() });
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    return res.json(message);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
