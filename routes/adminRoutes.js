const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// 🔐 Admin login
router.post('/login', adminController.loginAdmin);

// 🔒 Protected: Get all users (only for admin)
router.get('/users', verifyToken, verifyAdmin, adminController.getAllUsers);


//messages api
// 📦 Get all messages (paginated) - Admin only
router.get('/messages', verifyToken, verifyAdmin, adminController.getMessagesTableView);



module.exports = router;
