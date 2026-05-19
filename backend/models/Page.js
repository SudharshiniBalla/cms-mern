const mongoose = require('mongoose');

const seoSchema = new mongoose.Schema({
  title: { type: String, maxlength: 70 },
  description: { type: String, maxlength: 160 },
  keywords: [String],
  ogImage: String,
  canonicalUrl: String,
  noIndex: { type: Boolean, default: false },
  noFollow: { type: Boolean, default: false },
});

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Page title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'archived'],
      default: 'draft',
    },
    blocks: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
    },
    seo: { type: seoSchema, default: {} },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    publishedAt: Date,
    thumbnail: String,
    tags: [String],
    category: String,
    viewCount: { type: Number, default: 0 },
    isHomePage: { type: Boolean, default: false },
    parentPage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
    },
    revisions: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true }
);

// Index for search
pageSchema.index({ title: 'text', tags: 'text' });
pageSchema.index({ status: 1 });

module.exports = mongoose.model('Page', pageSchema);