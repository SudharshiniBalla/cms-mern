const Analytics = require('../models/Analytics');
const Page = require('../models/Page');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalPages, publishedPages, draftPages, pendingPages] = await Promise.all([
      Page.countDocuments(),
      Page.countDocuments({ status: 'published' }),
      Page.countDocuments({ status: 'draft' }),
      Page.countDocuments({ status: 'pending' }),
    ]);

    const topPages = await Page.find({ status: 'published' })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('title slug viewCount');

    const recentPages = await Page.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('author', 'name')
      .select('title status updatedAt author');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const analyticsData = await Analytics.find({ date: { $gte: thirtyDaysAgo } })
      .sort({ date: 1 });

    res.json({
      success: true,
      stats: { totalPages, publishedPages, draftPages, pendingPages },
      topPages,
      recentPages,
      analyticsData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackPageView = async (req, res) => {
  try {
    const { pageId, pageSlug, pageTitle } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Analytics.findOneAndUpdate(
      { page: pageId, date: today },
      {
        $inc: { views: 1 },
        $setOnInsert: { pageSlug, pageTitle, page: pageId },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPageAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const analytics = await Analytics.find({
      page: req.params.pageId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
