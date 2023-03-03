require('dotenv').config();
require('express-async-errors');

const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors')
const app = express();
const corsOptions = require('./config/corsOptions');
const cookieParser = require('cookie-parser')
const path = require('path')
const errorHandler = require('./middleware/errorHandler')
const { logEvents, logger } = require('./middleware/logger')



app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(cors(corsOptions));

app.use(cookieParser());

app.use(express.json())

app.use(logger)


app.use(express.static(path.join(__dirname, 'public')))

app.use('/auth', require('./routes/authRoutes'))
app.use('/user', require('./routes/PasswordResetRoutes'))

app.all('*', (req, res) =>{
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if(req.accepts('json')){
        res.json({ message: '404 Not Found'})
    }else {
        res.type('txt').send('404 Not Found')
    }
})


app.use(errorHandler)

module.exports = app