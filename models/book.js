const Sequelize = require('sequelize');
const database = require('./connection');
const User = require('./user');

const Book = database.define('book', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    category: {
        type: Sequelize.STRING,
        allowNull: false
    },
    author: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: 'pending' // Valor padrão 'available'
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    approvalStatus: {
        type:Sequelize.STRING,
        defaultValue: 'pending' // Status de aprovação pendente por padrão
    }
});

Book.belongsTo(User, { foreignKey: 'userId' });
// Book.sync({force:true})
module.exports = Book;

