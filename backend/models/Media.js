const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    originalName: String,
    url: { type: String, required: true },
    publicId: String, // Cloudinary public ID
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'audio'],
      required: true,
    },
    mimeType: String,
    size: Number, // bytes
    width: Number,
    height: Number,
    alt: String,
    caption: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: { type: String, default: 'general' },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
