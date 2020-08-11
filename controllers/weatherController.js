const mongoose = require('mongoose');
const {getCurrentWeatherFromAPI} = require('./weatherApiController')
const {convertKelvinToCelsius} = require('./Helpers')
const CurrentWeather = require('../models/CurrentWeather');
const ONE_HOUR_IN_MILISEC = 60*60*1000

exports.postCurrentWeather = async (req, res, next) => {
    const {city} = req.body;
    const currentTimestamp = new Date().getTime();
    const timestampOfEarliestValidData = currentTimestamp - ONE_HOUR_IN_MILISEC;
    try{
        const weatherFromDb = await CurrentWeather.findOne({
            city:city, 
            timestamp: {$gte: timestampOfEarliestValidData}
        })
        if(!weatherFromDb){
            const currentWeather = await getCurrentWeatherFromAPI(city);
            if(!currentWeather) {
                const error = new Error('City not found')
                error.status = 404;
                throw error;
            }
            const description = currentWeather.weather[0].description;
            const temperature = convertKelvinToCelsius(currentWeather.main.temp)
            const humidity = currentWeather.main.humidity;
            const newCurrentWeather = new CurrentWeather({
                description: description,
                city: city,
                temperature: temperature,
                humidity: humidity,
                timestamp: new Date().getTime()
            })
            const savedCurrentWeather = await newCurrentWeather.save();
            
            res.status(200).json({currentWeather: savedCurrentWeather})
        }
        else {
            console.log(weatherFromDb)
            res.status(200).json({currentWeather: weatherFromDb})
        }
    }
    catch (error) {
        next(error);
    }
    
    
    

}