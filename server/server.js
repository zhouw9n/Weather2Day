import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); //Allow request from frontend client

// Current Weather & Forcast
app.get('/api/weather/forecast', async(req, res) => {
    const { city } = req.query;

    try {
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&days=3&q=${city}&aqi=yes`);
        
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({error: data.error.message});
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

// Search & Autofill
app.get('/api/weather/search', async(req, res) => {
    const { query } = req.query;

    try {
        const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${process.env.WEATHER_API_KEY}&q=${query}`);
        
        const data = await response.json();

        if (data.error) {
            return res.status(400).json({error: data.error.message});
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({error: 'Server error'});
    }
});

app.listen(PORT);