require('dotenv').config()
const express = require('express')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'assets')))
app.use(express.static(path.join(__dirname, 'images')))
app.use(express.json())
app.use(flash())

const oneDay = 1000 * 60 * 60 * 24

app.use(session({
    secret: process.env.SESSION,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use('/', require('./routes/userRoutes'))
app.use('/book', require('./routes/bookRoutes'))
app.use('/trade', require('./routes/tradeRoutes'))

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running, port ${PORT}`)
})