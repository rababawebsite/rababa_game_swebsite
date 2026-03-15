import express from 'express';
import multer from 'multer';
import ImageKit from '@imagekit/nodejs';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Lazy initialization of ImageKit (after dotenv loads)
let imagekit = null;
const getImageKit = () => {
  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
  }
  return imagekit;
};

// Use memory storage for multer (files stored in buffer, not disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP, MP4, WebM, OGG, and MOV are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const DEFAULT_FOLDER = '/game-ads';

const sanitizeFolder = (value) => {
  if (!value || typeof value !== 'string') {
    return DEFAULT_FOLDER;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_FOLDER;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (!/^\/[a-zA-Z0-9/_-]{1,120}$/.test(normalized)) {
    return DEFAULT_FOLDER;
  }

  return normalized;
};

const sanitizeFilePrefix = (value, fallback = 'asset') => {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
};

const uploadAsset = async (file, folder, filePrefix) => {
  const result = await getImageKit().upload({
    file: file.buffer.toString('base64'),
    fileName: `${filePrefix}-${Date.now()}-${file.originalname}`,
    folder,
    useUniqueFileName: true,
  });

  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
    thumbnailUrl: result.thumbnailUrl,
    fileType: file.mimetype,
  };
};

router.post('/asset', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = sanitizeFolder(req.body?.folder);
    const filePrefix = sanitizeFilePrefix(req.body?.fileNamePrefix, 'asset');
    const result = await uploadAsset(req.file, folder, filePrefix);
    res.json(result);
  } catch (error) {
    console.error('Asset upload error:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// Upload single image to ImageKit
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = sanitizeFolder(req.body?.folder);
    const filePrefix = sanitizeFilePrefix(req.body?.fileNamePrefix, 'image');

    // Upload to ImageKit
    const result = await uploadAsset(req.file, folder, filePrefix);
    res.json(result);
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images to ImageKit
router.post('/images', protect, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const folder = sanitizeFolder(req.body?.folder);
    const filePrefix = sanitizeFilePrefix(req.body?.fileNamePrefix, 'image');

    // Upload all files to ImageKit
    const uploadPromises = req.files.map(file => uploadAsset(file, folder, filePrefix));

    const results = await Promise.all(uploadPromises);

    res.json(results);
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Delete image from ImageKit
router.delete('/image/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID required' });
    }

    await getImageKit().deleteFile(fileId);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('ImageKit delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Get authentication parameters for client-side uploads (if needed)
router.get('/auth', protect, (req, res) => {
  try {
    const authParams = getImageKit().getAuthenticationParameters();
    res.json(authParams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth parameters' });
  }
});

export default router;
