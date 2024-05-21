const router = require('express').Router();
const bookCtrl = require('../controllers/bookController');
const userMiddleware = require('../middlewares/middleware');
const multer = require('multer');
const check = require('express-validator').check

router.get('/', userMiddleware.isUser, bookCtrl.getBooks)

router.get('/add', userMiddleware.isUser, bookCtrl.addBookScreen)

router.post('/add', userMiddleware.isUser,
    multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, "images/");
            },
            filename: (req, file, cb) => {
                cb(null, Date.now() + "-" + file.originalname);
            }
        })
    }).single("image"),
    check("name")
        .not()
        .isEmpty()
        .withMessage("Nome é obrigatório !"),
    check("description")
        .not()
        .isEmpty()
        .withMessage("Descrição é obrigatório !"),
    check("category")
        .not()
        .isEmpty()
        .withMessage("Defina uma categoria !"),
    check("image").custom((value, { req }) => {
        if (req.file) return true;
        else throw "Adicione uma imagem !";
    }),
    bookCtrl.addBook
);

router.post('/remove/:id', userMiddleware.isUser, bookCtrl.removeBook)

router.get('/admin/book-request', userMiddleware.isAdmin, bookCtrl.pendingBooks)

router.post('/admin/accept-book/:id', userMiddleware.isAdmin, bookCtrl.approveBook)

router.post('/admin/reject-book/:id', userMiddleware.isAdmin, bookCtrl.rejectBook)

router.get('/:id', userMiddleware.isUser, bookCtrl.getBookById)

module.exports = router;