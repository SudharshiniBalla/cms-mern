const express = require('express');
const router = express.Router();
const { getMedia, uploadMedia, updateMedia, deleteMedia, upload } = require('../controllers/mediaController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getMedia).post(upload.single('file'), uploadMedia);
router.route('/:id').put(updateMedia).delete(deleteMedia);

module.exports = router;
