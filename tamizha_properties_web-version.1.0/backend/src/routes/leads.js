const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/leadsController');

router.get('/stats', auth, c.getStats);
router.get('/by-user/:userId', auth, c.getByUser);
router.get('/', auth, c.getAll);
router.get('/:id', auth, c.getOne);
router.post('/', auth, c.create);
router.put('/:id', auth, c.update);
router.patch('/:id', auth, c.update);
router.delete('/:id', auth, c.remove);
router.post('/:leadId/assign-login', auth, c.assignLogin);

module.exports = router;
