import express from 'express';
import { body, validationResult } from 'express-validator';
import PlatformLinks from '../models/PlatformLinks.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const defaultSocialLinks = {
  YouTube: 'https://www.youtube.com/user/RababaGames/',
  Facebook: 'https://www.facebook.com/rababagames/',
  Instagram: 'https://www.instagram.com/rababagames/',
  Twitter: 'https://twitter.com/rababagames/',
};

// Get platform links
router.get('/', async (req, res) => {
  try {
    let links = await PlatformLinks.findOne();
    if (!links) {
      links = await PlatformLinks.create(defaultSocialLinks);
    } else {
      let shouldSave = false;
      Object.entries(defaultSocialLinks).forEach(([key, value]) => {
        if (!links[key] || String(links[key]).trim() === '') {
          links[key] = value;
          shouldSave = true;
        }
      });
      if (shouldSave) {
        await links.save();
      }
    }
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update platform links
router.post('/update', protect, [
  body().custom(value => typeof value === 'object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }
    let links = await PlatformLinks.findOne();
    if (!links) {
      links = await PlatformLinks.create(defaultSocialLinks);
    }
    Object.keys(req.body).forEach(key => {
      if (links[key] !== undefined) {
        links[key] = req.body[key];
      }
    });
    await links.save();
    res.json({ message: 'Platform links updated successfully', links });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
