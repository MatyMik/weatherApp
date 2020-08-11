const axios = require('axios');

const axiosInstance = axios.create({
    baseURL: "https://community-open-weather-map.p.rapidapi.com/",
    headers: {
        "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
        "x-rapidapi-key": process.env.WEATHER_API_KEY,
        "useQueryString": true
    }
})

module.exports = axiosInstance;