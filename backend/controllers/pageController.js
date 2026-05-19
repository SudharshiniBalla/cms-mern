const slugify = require('slugify');
const Page = require('../models/Page');
const Analytics = require('../models/Analytics');

const generateSlug = async (title, excludeId = null) => {
  let slug = slugify(title, { lower: true, strict: true });
  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Page.findOne(query);
  if (existing) slug = `${slug}-${Date.now()}`;
  return slug;
};

// @desc    Get all pages
// @route   GET /api/pages
// @access  Private
exports.getPages = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, category, tag } = req.query;
    const query = {};

    // Authors only see their own pages
    if (req.user.role === 'author') query.author = req.user.id;
    if (status) query.status = status;
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };

    const total = await Page.countDocuments(query);
    const pages = await Page.find(query)
      .populate('author', 'name email avatar')
      .populate('lastEditedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-blocks -revisions');

    res.json({
      success: true,
      total,
      pages,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single page
// @route   GET /api/pages/:id
// @access  Private
exports.getPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('author', 'name email avatar')
      .populate('lastEditedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('template', 'name');

    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    res.json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get page by slug (public)
// @route   GET /api/pages/slug/:slug
// @access  Public
exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('author', 'name avatar');

    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    res.json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create page
// @route   POST /api/pages
// @access  Private
exports.createPage = async (req, res) => {
  try {
    const { title, blocks, template, seo, tags, category, thumbnail, parentPage } = req.body;
    const slug = await generateSlug(title);

    const page = await Page.create({
      title,
      slug,
      blocks: blocks || [],
      template,
      seo,
      tags,
      category,
      thumbnail,
      parentPage,
      author: req.user.id,
      lastEditedBy: req.user.id,
    });

    await page.populate('author', 'name email avatar');
    res.status(201).json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private
exports.updatePage = async (req, res) => {
  try {
    let page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    // Authorization: authors can only edit their own pages
    if (req.user.role === 'author' && page.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this page' });
    }

    const { title, blocks, seo, tags, category, thumbnail, status } = req.body;

    // Save revision before update
    if (page.blocks?.length > 0) {
      page.revisions.push({
        blocks: page.blocks,
        editedBy: req.user.id,
        note: `Auto-save before edit at ${new Date().toISOString()}`,
      });
      // Keep only last 10 revisions
      if (page.revisions.length > 10) page.revisions.shift();
    }

    if (title && title !== page.title) {
      page.slug = await generateSlug(title, page._id);
    }

    page.title = title || page.title;
    page.blocks = blocks !== undefined ? blocks : page.blocks;
    page.seo = seo || page.seo;
    page.tags = tags || page.tags;
    page.category = category || page.category;
    page.thumbnail = thumbnail || page.thumbnail;
    page.lastEditedBy = req.user.id;

    // Status transitions
    if (status) {
      if (status === 'published') {
        if (!req.user.permissions.canPublish && req.user.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Not authorized to publish' });
        }
        page.publishedAt = new Date();
      }
      if (status === 'pending') page.status = 'pending';
      if (['admin', 'editor'].includes(req.user.role)) page.status = status;
      else if (status === 'draft') page.status = 'draft';
      else if (status === 'pending') page.status = 'pending';
    }

    await page.save();
    await page.populate('author', 'name email avatar');
    await page.populate('lastEditedBy', 'name');

    res.json({ success: true, page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/publish page
// @route   PATCH /api/pages/:id/approve
// @access  Private (Editor/Admin)
exports.approvePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndUpdate(
      req.params.id,
      {
        status: 'published',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
      { new: true }
    ).populate('author', 'name email');

    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, page, message: 'Page approved and published' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private
exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    if (!req.user.permissions.canDelete && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete pages' });
    }

    await page.deleteOne();
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get page revisions
// @route   GET /api/pages/:id/revisions
// @access  Private
exports.getRevisions = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .select('revisions title')
      .populate('revisions.editedBy', 'name');
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, revisions: page.revisions.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore revision
// @route   POST /api/pages/:id/revisions/:revisionIndex/restore
// @access  Private
exports.restoreRevision = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    const revision = page.revisions[req.params.revisionIndex];
    if (!revision) return res.status(404).json({ success: false, message: 'Revision not found' });
    page.blocks = revision.blocks;
    page.lastEditedBy = req.user.id;
    await page.save();
    res.json({ success: true, page, message: 'Revision restored' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate page
// @route   POST /api/pages/:id/duplicate
// @access  Private
exports.duplicatePage = async (req, res) => {
  try {
    const original = await Page.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Page not found' });

    const slug = await generateSlug(`${original.title} copy`);
    const duplicate = await Page.create({
      title: `${original.title} (Copy)`,
      slug,
      blocks: original.blocks,
      seo: original.seo,
      tags: original.tags,
      category: original.category,
      thumbnail: original.thumbnail,
      template: original.template,
      author: req.user.id,
      status: 'draft',
    });

    res.status(201).json({ success: true, page: duplicate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
