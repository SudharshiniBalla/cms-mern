const express = require('express');
const router = express.Router();
const { getDashboardStats, trackPageView, getPageAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.post('/track', trackPageView);
router.use(protect);
router.get('/dashboard', authorize('admin', 'editor'), getDashboardStats);
router.get('/page/:pageId', authorize('admin', 'editor'), getPageAnalytics);

module.exports = router;
