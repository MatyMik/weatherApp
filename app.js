const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const weatherRouter = require('./router/weatherRouter')

const app = express();

app.use(bodyParser.json());
app.use(cors({
    origin: process.env.ORIGIN
}))
app.use(weatherRouter)

mongoose.connect(
    process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true}
    )
    .then( result => {
        (app).listen(process.env.PORT || 8080)
})