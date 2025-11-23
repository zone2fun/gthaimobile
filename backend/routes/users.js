const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, getFreshFaces } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAllUsers);
router.get('/fresh-faces', protect, getFreshFaces);
router.get('/:id', protect, getUserById);

module.exports = router;
