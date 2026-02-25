const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

// All room routes require authentication
router.use(auth);

// @route   POST /api/rooms
router.post('/', roomController.createRoom);

// @route   POST /api/rooms/join
router.post('/join', roomController.joinRoom);

// @route   GET /api/rooms
router.get('/', roomController.getMyRooms);

// @route   GET /api/rooms/:roomId
router.get('/:roomId', roomController.getRoom);

// @route   PUT /api/rooms/:roomId/close
router.put('/:roomId/close', roomController.closeRoom);

// @route   PUT /api/rooms/:roomId/grant-access
router.put('/:roomId/grant-access', roomController.grantAccess);

// @route   PUT /api/rooms/:roomId/revoke-access
router.put('/:roomId/revoke-access', roomController.revokeAccess);

// @route   DELETE /api/rooms/:roomId
router.delete('/:roomId', roomController.deleteRoom);

// @route   PUT /api/rooms/:roomId/kick
router.put('/:roomId/kick', roomController.kickParticipant);

module.exports = router;
