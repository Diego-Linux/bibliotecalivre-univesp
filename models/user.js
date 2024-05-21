const Sequelize = require('sequelize');
const database = require('./connection');

const User = database.define('user', {
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
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
});
// User.sync({force:true})
module.exports = User;
