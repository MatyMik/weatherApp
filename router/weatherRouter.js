const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController')

router.post('/currentweather', weatherController.postCurrentWeather);


module.exports = router;