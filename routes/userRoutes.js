const router = require('express').Router()
const userCtrl = require('../controllers/userController')
const Middleware = require('../middlewares/middleware')

router.get('/register', Middleware.notUser, userCtrl.registerScreen)

router.post('/register', Middleware.notUser, userCtrl.createUser)

router.get('/login', Middleware.notUser, userCtrl.loginScreen)

router.post('/login', Middleware.notUser, userCtrl.userLogin);

router.get('/mybooks', Middleware.isUser, userCtrl.getBooksUser)

router.get('/req/:id', Middleware.isUser, userCtrl.getSolicitationPage)

router.all('/logout', Middleware.isUser, userCtrl.logout);

module.exports = router;