const Sequelize = require('sequelize');
const database = require('./connection');

const Trade = database.define('trade', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    }
});
// Trade.sync({ force: true })
module.exports = Trade;