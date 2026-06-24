const router = require('express').Router();
const { adminLogin, adminRegister } = require('../controllers/adminAuthController');

router.post('/login', adminLogin);
router.post('/register', adminRegister);

module.exports = router;
