const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CurrentWeatherSchema = new Schema({
    city: {
        type: String,
        required: true
    },
    timestamp: { 
        type: Date,
        required: true
    },
    temperature: Number,
    humidity: Number,
    description: String,
})

module.exports = mongoose.model("CurrentWeather", CurrentWeatherSchema);