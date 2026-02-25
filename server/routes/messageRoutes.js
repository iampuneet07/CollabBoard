const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.use(auth);

// @route   GET /api/messages/:roomId
router.get('/:roomId', messageController.getMessages);

module.exports = router;
