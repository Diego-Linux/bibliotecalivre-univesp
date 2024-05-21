const User = require('../models/user')
const Book = require('../models/book')
const Trade = require('../models/trade')
const UserTrade = require('../models/usertrade')
const Sequelize = require('sequelize')
const validationResult = require('express-validator').validationResult;

exports.addBookScreen = async (req, res) => {
    res.render('add', {
        authError: req.flash('authError')[0],
        validationErrors: req.flash('validationErrors'),
        isUser: true,
        isAdmin: req.session.isAdmin,
        bookAdded: req.flash('added')[0],
        req: req,
        pageTitle: "Adicionar Livro",
    });
};

exports.addBook = async (req, res) => {
    if (validationResult(req).isEmpty()) {
        try {
            await Book.create({
                name: req.body.name,
                description: req.body.description,
                category: req.body.category,
                author: req.body.author,
                image: req.body.image = req.file.filename,
                userId: req.session.userId,
                approvalStatus: 'pending' // Status de aprovação pendente por padrão
            });
            req.flash('added', true)
            res.redirect('/book/add')
        } catch (err) {
            return res.status(400).json({ error: 'Erro: ' + err.message });
        }
    } else {
        req.flash('validationErrors', validationResult(req).array());
        res.redirect('/book/add');
    }
};

// Aprovar ou rejeitar um livro (apenas para o administrador)
exports.approveBook = async (req, res) => {
    if (req.session.isAdmin) {
        const bookId = req.params.id;
        try {
            const book = await Book.findByPk(bookId);
            if (!book) {
                return res.status(404).send('Livro não encontrado');
            }
            // Atualizar o status de aprovação do livro
            book.approvalStatus = 'approved';
            book.status = 'available';
            await book.save();

            res.redirect('/book/admin/book-request');
        } catch (error) {
            console.error('Erro ao aprovar livro:', error);
            res.status(500).send('Erro ao aprovar livro');
        }
    } else {
        res.status(403).send('Acesso não autorizado');
    }
};

exports.rejectBook = async (req, res) => {
    if (req.session.isAdmin) {
        const bookId = req.params.id;
        try {
            const book = await Book.findByPk(bookId);
            if (!book) {
                return res.status(404).send('Livro não encontrado');
            }
            // Atualizar o status de remoção do livro
            book.status = 'rejected';
            await book.save();

            res.redirect('/book/admin/book-request');
        } catch (error) {
            console.error('Erro ao rejeitar livro:', error);
            res.status(500).send('Erro ao rejeitar livro');
        }
    } else {
        res.status(403).send('Acesso não autorizado');
    }
};

exports.pendingBooks = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
    const perPage = 10; // Número de itens por página
    const offset = (page - 1) * perPage; // Cálculo do offset

    try {
        let pendingBooks;
        const searchQuery = req.query.search; // Termo de pesquisa
        // Cria um objeto para armazenar as condições de pesquisa
        const whereClause = {};
        // Adiciona a condição de pesquisa por qualquer palavra no título, se um termo de pesquisa foi especificado
        if (searchQuery) {
            whereClause.name = {
                [Sequelize.Op.like]: `%${searchQuery}%`
            };
        }
        whereClause.status = 'pending';

        // Realiza a busca considerando as condições de pesquisa
        pendingBooks = await Book.findAll({
            limit: perPage,
            offset: offset,
            include: [{ model: User, attributes: ['id', 'name'] }], // Inclui informações do usuário que adicionou o livro
            where: whereClause // Aplica as condições de pesquisa
        });
        // Conta o número total de livros pendentes para calcular o total de páginas
        const totalCount = await Book.count({ where: { status: 'pending' } });
        const totalPages = Math.ceil(totalCount / perPage);

        res.render('pendingbooks', {
            validationErrors: req.flash('validationErrors'),
            pendingBooks: pendingBooks,
            req: req,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery, // Enviar o termo de pesquisa para o frontend
        });
    } catch (error) {
        console.log(error)
        console.error('Erro ao buscar livros pendentes:', error);
        res.status(500).send('Erro ao buscar livros pendentes');
    }
};
;
exports.getBooks = async (req, res) => {
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
        const whereClause = {};
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
        whereClause.status = 'available';
        whereClause.approvalStatus = 'approved'; // Condição para exibir apenas livros aprovados

        // Realiza a busca considerando as condições de categoria, pesquisa e aprovação
        books = await Book.findAll({
            limit: perPage,
            offset: offset,
            include: [{ model: User }],
            where: whereClause // Aplica as condições de pesquisa
        });
        // Conta o número total de livros aprovados para calcular o total de páginas
        const totalCount = await Book.count({ where: { approvalStatus: 'approved' } });
        const totalPages = Math.ceil(totalCount / perPage);
        res.render('home', {
            validationErrors: req.flash('validationErrors'),
            books: books,
            req: req,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: selectedCategory, // Enviar a categoria selecionada para o frontend
            categories: categories, // Enviar as categorias para o frontend
            bookAdded: req.flash('added')[0],
        });
        // return res.json(books)
    } catch (error) {
        console.error('Erro ao buscar livros:', error);
        res.status(500).send('Erro ao buscar livros');
    }
};

exports.getBookById = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const userId = req.session.userId; // ID do usuário logado
        const isAdmin = req.session.isAdmin; // Verifica se o usuário é um administrador

        // Busca o livro pelo ID com inclusão do modelo User
        const book = await Book.findByPk(bookId, { include: User });

        // Verifica se o usuário está envolvido em trocas relacionadas ao livro como remetente ou destinatário
        const relatedTrades = await UserTrade.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { booksender_id: bookId },
                    { bookreceiver_id: bookId }
                ],
                [Sequelize.Op.and]: [
                    Sequelize.literal(`(sender_id = ${userId} OR receiver_id = ${userId})`)
                ]
            }
        });

        // Se o usuário está envolvido em trocas relacionadas, renderiza os detalhes do livro
        if (relatedTrades.length > 0) {
            const senderBookId = relatedTrades[0].booksender_id;
            const receiverBookId = relatedTrades[0].bookreceiver_id;

            // Busca os livros do sender e do receiver na troca
            const senderBook = await Book.findByPk(senderBookId, { include: User });
            const receiverBook = await Book.findByPk(receiverBookId, { include: User });
            
            res.render("book-details", {
                book: book,
                senderBook: senderBook,
                receiverBook: receiverBook,
                isUser: req.session.userId,
                isAdmin: req.session.isAdmin,
                req: req,
                pageTitle: book.name
            });
        } else {
            // Verifica se o livro está disponível e aprovado, ou se o usuário é um admin
            if ((book.status === 'available' && book.approvalStatus === 'approved') || isAdmin) {
                res.render("book-details", {
                    book: book,
                    isUser: req.session.userId,
                    isAdmin: isAdmin,
                    req: req,
                    pageTitle: book.name
                });
            } else {
                // Caso contrário, renderiza uma página de erro informando que o livro não está disponível para o usuário
                res.status(403).render("error", {
                    message: "Este livro não está mais disponível.",
                    req:req,
                    error: { status: 403 }
                });
            }
        }
    } catch (error) {
        console.error("Erro ao buscar o livro:", error);
        res.status(500).send("Erro ao buscar o livro");
    }
};

exports.removeBook = async (req, res) => {
    const { id } = req.params;
    try {
        // Verifique se o livro existe e se o usuário logado é o proprietário
        const book = await Book.findOne({ where: { id: id, userId: req.session.userId } });
        if (!book) {
            return res.status(404).send('Livro não encontrado ou você não tem permissão para cancelar este livro.');
        }

        // Encontra as trades associadas a esse livro na tabela intermediária UserTrade
        const userTrades = await UserTrade.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { booksender_id: id },
                    { bookreceiver_id: id }
                ]
            },
            include: [
                { model: Trade, as: 'trade', where: { status: 'pending' } }
            ]
        });

        // Atualiza o status das trades associadas para "canceled"
        await Promise.all(userTrades.map(async (userTrade) => {
            const trade = userTrade.trade;
            if (trade) {
                await trade.update({ status: 'canceled' });
            }
        }));

        // Remove o livro após cancelar as trades associadas
        await book.update({status:'canceled'});

        res.redirect('/mybooks'); // Redireciona para a página de livros após a atualização do status e remoção do livro
    } catch (error) {
        console.error('Erro ao cancelar livro e suas trades:', error);
        res.status(500).send('Erro ao cancelar livro e suas trades.');
    }
};



