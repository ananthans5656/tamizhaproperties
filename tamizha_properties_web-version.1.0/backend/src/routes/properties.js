const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/propertiesController');

router.get('/featured', auth, c.getFeatured);
router.get('/stats', auth, c.getStats);
router.get('/', auth, c.getAll);
router.get('/:id', auth, c.getOne);
router.post('/', auth, c.create);
router.put('/:id', auth, c.update);
router.patch('/:id', auth, c.update);
router.delete('/:id', auth, c.remove);

module.exports = router;
