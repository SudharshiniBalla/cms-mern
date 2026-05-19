const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      unique: true,
    },
    description: String,
    thumbnail: String,
    blocks: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    category: {
      type: String,
      enum: ['landing', 'blog', 'portfolio', 'ecommerce', 'corporate', 'blank'],
      default: 'blank',
    },
    isPublic: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    usageCount: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);