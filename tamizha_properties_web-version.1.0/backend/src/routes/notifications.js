const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/notificationsController');

router.get('/admin', auth, c.getForAdmin);
router.get('/user', auth, c.getForUser);
router.put('/:id/read', auth, c.markRead);
router.put('/mark-all-read', auth, c.markAllRead);
router.post('/visits/:visitId/accept', auth, c.acceptVisit);
router.post('/visits/:visitId/deny', auth, c.denyVisit);
router.post('/delete-many', auth, c.deleteNotifs);

module.exports = router;
