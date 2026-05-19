const express = require('express');
const router = express.Router();
const { getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate } = require('../controllers/templateController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.use(protect);
router.post('/', authorize('admin', 'editor'), createTemplate);
router.put('/:id', authorize('admin', 'editor'), updateTemplate);
router.delete('/:id', authorize('admin'), deleteTemplate);

module.exports = router;
