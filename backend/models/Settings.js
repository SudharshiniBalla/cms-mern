const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'My CMS Site' },
    siteDescription: String,
    siteUrl: String,
    logo: String,
    favicon: String,
    primaryColor: { type: String, default: '#3b82f6' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    defaultMetaTitle: String,
    defaultMetaDescription: String,
    googleAnalyticsId: String,
    facebookPixelId: String,
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String,
    },
    emailSettings: {
      fromName: String,
      fromEmail: String,
      smtpHost: String,
      smtpPort: Number,
    },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: false },
    defaultUserRole: { type: String, default: 'author' },
    postsPerPage: { type: Number, default: 10 },
    approvalRequired: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
