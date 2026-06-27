import { getInsuranceAdvice } from '../services/geminiService.js';
import axios from 'axios';

// STATE_COORDS removed in favor of OpenStreetMap Geocoding

export const adviseInsurance = async (req, res, next) => {
  try {
    const { state, district, crop, season, acres, language } = req.body;
    if (!state || !crop || !season || !acres) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let envData = null;
    try {
      let coords = { lat: 19.7515, lng: 75.7139 }; // Default Maharashtra
      try {
        const queryStr = district ? `${district}, ${state}, India` : `${state}, India`;
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=1`;
        const geoRes = await axios.get(geoUrl, { headers: { 'User-Agent': 'KisanSaathi/1.0' } });
        if (geoRes.data && geoRes.data.length > 0) {
          coords = { lat: parseFloat(geoRes.data[0].lat), lng: parseFloat(geoRes.data[0].lon) };
        }
      } catch (geoErr) {
        console.log('Geocoding failed, using fallback coordinates');
      }
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,precipitation_sum&current=soil_moisture_0_to_7cm&timezone=Asia/Kolkata`;
      const response = await axios.get(meteoUrl);
      envData = {
        soil_moisture: response.data.current.soil_moisture_0_to_7cm,
        precipitation: response.data.daily.precipitation_sum[0] || 0,
        temp: response.data.daily.temperature_2m_max[0] || 35
      };
    } catch (e) {
      console.log('Failed to fetch weather data:', e.message);
    }

    let parsedAdvice;
    try {
      const responseText = await getInsuranceAdvice(state, district, crop, season, acres, language || 'hi', envData);
      parsedAdvice = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Failed to parse AI response as JSON', parseError.message);
      parsedAdvice = {
        risk_level: "Medium",
        advice: "Advice could not be structured. Please consult local authorities."
      };
    }
    res.json(parsedAdvice);
  } catch (error) {
    next(error);
  }
};
