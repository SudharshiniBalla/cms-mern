const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    page: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
    pageSlug: String,
    pageTitle: String,
    views: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 }, // seconds
    bounceRate: { type: Number, default: 0 }, // percentage
    date: { type: Date, default: Date.now },
    referrers: [{ source: String, count: Number }],
    devices: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
    },
    countries: [{ country: String, count: Number }],
  },
  { timestamps: true }
);

analyticsSchema.index({ page: 1, date: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
