const express = require('express');
const router = express.Router();
const whiteboardController = require('../controllers/whiteboardController');
const auth = require('../middleware/auth');

router.use(auth);

// @route   GET /api/whiteboard/:roomId
router.get('/:roomId', whiteboardController.getWhiteboard);

// @route   POST /api/whiteboard/:roomId/snapshot
router.post('/:roomId/snapshot', whiteboardController.saveSnapshot);

// @route   DELETE /api/whiteboard/:roomId
router.delete('/:roomId', whiteboardController.clearWhiteboard);

module.exports = router;
