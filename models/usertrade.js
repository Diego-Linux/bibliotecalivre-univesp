const User = require('./user')
const Book = require('./book')
const Trade = require('./trade')
const Sequelize = require('sequelize');
const database = require('./connection');

const user_trade = database.define('user_trade', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
});

// Associação entre user_trade e User (sender e receiver)
user_trade.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
user_trade.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });

// Associação entre user_trade e Book (booksender e receiverbook)
user_trade.belongsTo(Book, { foreignKey: 'booksender_id', as: 'booksender' });
user_trade.belongsTo(Book, { foreignKey: 'bookreceiver_id', as: 'bookreceiver' });

// Associação entre user_trade e Trade
user_trade.belongsTo(Trade, { foreignKey: 'trade_id', as: 'trade' });
// user_trade.sync({ force: true })

module.exports = user_trade;