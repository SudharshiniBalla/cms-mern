const Media = require('../models/Media');
const multer = require('multer');
const path = require('path');

// Simple local storage for media (use Cloudinary in production)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('File type not allowed'), false);
};

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

exports.getMedia = async (req, res) => {
  try {
    const { type, folder, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (folder) query.folder = folder;
    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileType = req.file.mimetype.startsWith('image/') ? 'image'
      : req.file.mimetype.startsWith('video/') ? 'video'
      : 'document';

    const media = await Media.create({
      name: req.body.name || req.file.originalname,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      type: fileType,
      mimeType: req.file.mimetype,
      size: req.file.size,
      alt: req.body.alt || '',
      caption: req.body.caption || '',
      folder: req.body.folder || 'general',
      uploadedBy: req.user.id,
    });

    res.status(201).json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });
    res.json({ success: true, media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });
    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
