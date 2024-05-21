const Sequelize = require('sequelize');
const User = require('../models/user')
const Book = require('../models/book')
const bcrypt = require('bcryptjs');
const validationResult = require('express-validator').validationResult;

exports.homeScreen = (req, res) => {
    res.render("home", {
        isUser: req.session.userId,
        isAdmin: req.session.isAdmin,
        name: req.session.name,
        req: req,
        pageTitle: "Home"
    });
};

exports.registerScreen = (req, res) => {
    const authError = req.flash('authError')[0];
    const validationErrors = req.flash('validationErrors');
    const lastTypedValues = req.session.lastTypedValues || {}; // Obtém os últimos valores digitados da sessão
    res.render('register', {
        authError,
        validationErrors,
        isUser: false,
        isAdmin: false,
        req: req,
        pageTitle: 'Crie uma conta',
        lastTypedValues // Passa os últimos valores digitados para o template EJS
    });
};

exports.createUser = async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;

    // Verifica se os campos estão preenchidos
    if (!name || !email || !password || !passwordConfirm) {
        req.flash('authError', 'Por favor preencha todos os campos');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }

    // Verifica se a senha possui pelo menos 6 caracteres
    if (password.length < 6) {
        req.flash('authError', 'Senha muito curta');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }

    // Verifica se as senhas coincidem
    if (passwordConfirm !== password) {
        req.flash('authError', 'As senhas não coincidem');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            req.session.lastTypedEmail = email;
            throw new Error('Este e-mail já está em uso');
        }

        await User.create({
            name,
            email,
            password: await bcrypt.hash(password, 10)
        });

        delete req.session.lastTypedValues;
        delete req.session.lastTypedEmail;
        return res.redirect('/login');
    } catch (err) {
        req.flash('authError', err.message || 'Erro desconhecido');
        req.session.lastTypedValues = req.body;
        return res.redirect('/register');
    }
};

exports.loginScreen = (req, res) => {
    const authError = req.flash('authError')[0];
    const validationErrors = req.flash('validationErrors');
    const lastTypedEmail = req.session.lastTypedEmail || ''; // Verifica se o último e-mail está na sessão
    res.render('login', {
        authError,
        validationErrors,
        lastTypedEmail, // Passa o último e-mail para o template
        isUser: false,
        req,
        isAdmin: false,
        pageTitle: 'Login'
    });
};

exports.userLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            req.flash('authError', 'Dados inválidos.');
            req.session.lastTypedEmail = email; // Atualiza o último e-mail digitado na sessão
            return res.redirect('/login');
        }
        const samePassword = await bcrypt.compare(password, user.password);
        if (!samePassword) {
            req.flash('authError', 'Dados inválidos.');
            req.session.lastTypedEmail = email; // Atualiza o último e-mail digitado na sessão
            return res.redirect('/login');
        }
        req.session.userId = user.id;
        req.session.isAdmin = user.isAdmin;
        if (req.session.isAdmin) {
            await Book.findAll();
            const totalCount = await Book.count({ where: { status: 'pending' } });
            req.session.pending = totalCount;
        }
        req.session.name = user.name;
        return res.redirect('/book');
    } catch (err) {
        req.flash('authError', err.message || 'Erro desconhecido');
        req.session.lastTypedEmail = email; // Atualiza o último e-mail digitado na sessão
        return res.redirect('/login');
    }
};

exports.getBooksUser = async (req, res) => {
    const userId = req.session.userId; // ID do usuário logado
    const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
    const perPage = 10; // Número de itens por página
    const offset = (page - 1) * perPage; // Cálculo do offset
    // Array de categorias
    const categories = ['Educação', 'Ficção'];
    try {
        let books;
        const selectedCategory = req.query.category; // Categoria selecionada
        const searchQuery = req.query.search; // Termo de pesquisa
        // Cria um objeto para armazenar as condições de pesquisa
        const whereClause = { userId: userId }; // Condição para buscar apenas os livros do usuário logado
        // Adiciona a condição de categoria, se uma categoria válida foi especificada
        if (selectedCategory && categories.includes(selectedCategory)) {
            whereClause.category = selectedCategory;
        }
        // Adiciona a condição de pesquisa por qualquer palavra no título, se um termo de pesquisa foi especificado
        if (searchQuery) {
            whereClause.name = {
                [Sequelize.Op.like]: `%${searchQuery}%`
            };
        }
        // Buscar os livros que estejam com status diferente de pending/rejected e canceled
        whereClause.status = {
            [Sequelize.Op.notIn]: ['pending', 'rejected', 'canceled']
        };    // Realiza a busca considerando as condições de categoria e pesquisa
        books = await Book.findAll({
            limit: perPage,
            offset: offset,
            include: [{ model: User }],
            where: whereClause // Aplica as condições de pesquisa
        });
        // Conta o número total de livros para calcular o total de páginas
        const totalCount = await Book.count({ where: whereClause }); // Conta apenas os livros do usuário logado
        const totalPages = Math.ceil(totalCount / perPage);
        res.render('mybooks', {
            validationErrors: req.flash('validationErrors'),
            books: books,
            req: req,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: selectedCategory,
            categories: categories,
            bookAdded: req.flash('added')[0],
        });
    } catch (error) {
        console.error('Erro ao buscar livros do usuário:', error);
        res.status(500).send('Erro ao buscar livros do usuário');
    }
};

exports.getSolicitationPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const tradeBookId = req.params.id;
        const tradeBook = await Book.findByPk(tradeBookId, { include: User });

        // Livros disponíveis do usuário
        const myBooks = await Book.findAll({
            where: { userId: userId, status: 'available' }
        });
        res.render('solicitation', {
            validationErrors: req.flash('validationErrors'),
            myBooks: myBooks,
            tradeBook: tradeBook,
            req: req,
            pageTitle: 'Solicitação de Troca'
        });
    } catch (error) {
        console.error('Erro ao carregar página de solicitação:', error);
        res.status(500).send('Erro ao carregar página de solicitação');
    }
};


exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};
