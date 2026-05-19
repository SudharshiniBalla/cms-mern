const express = require('express');
const router = express.Router();
const {
  getPages, getPage, getPageBySlug, createPage, updatePage,
  deletePage, approvePage, getRevisions, restoreRevision, duplicatePage
} = require('../controllers/pageController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/slug/:slug', getPageBySlug);

// Protected
router.use(protect);
router.route('/').get(getPages).post(createPage);
router.route('/:id').get(getPage).put(updatePage).delete(deletePage);
router.patch('/:id/approve', authorize('admin', 'editor'), approvePage);
router.get('/:id/revisions', getRevisions);
router.post('/:id/revisions/:revisionIndex/restore', getRevisions);
router.post('/:id/duplicate', duplicatePage);

module.exports = router;
