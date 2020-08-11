const axios = require("../axiosInstance");

exports.getCurrentWeatherFromAPI = async (city) => {
    try {
        response = await axios.get("/weather", {params: { 
            q: city
        }})
        return response.data
    }
    catch (err) {
        return err
    } 
}