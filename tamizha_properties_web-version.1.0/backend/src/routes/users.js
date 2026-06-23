const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/usersController');

router.get('/', auth, c.getAll);
router.get('/:id', auth, c.getOne);
router.post('/', c.create);
router.put('/:id', auth, c.update);
router.delete('/:id', auth, c.remove);
router.post('/change-password', auth, c.changePassword);

module.exports = router;
