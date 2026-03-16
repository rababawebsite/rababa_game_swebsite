import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    unique: true,
  },
  consentGiven: {
    type: Boolean,
    default: true,
  },
  sourcePage: {
    type: String,
    default: '',
  },
  subscribedGame: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
  },
  subscribedGameId: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

newsletterSubscriberSchema.index({ createdAt: -1 });

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
