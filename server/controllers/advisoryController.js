import { getAdvisory } from '../services/geminiService.js';
import db from '../db/index.js';
import crypto from 'crypto';
import axios from 'axios';

const STATE_COORDS = {
  "Andhra Pradesh": { lat: 15.9129, lng: 79.7400 },
  "Bihar": { lat: 25.0961, lng: 85.3131 },
  "Gujarat": { lat: 22.2587, lng: 71.1924 },
  "Haryana": { lat: 29.0588, lng: 76.0856 },
  "Karnataka": { lat: 15.3173, lng: 75.7139 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  "Maharashtra": { lat: 19.7515, lng: 75.7139 },
  "Punjab": { lat: 31.1471, lng: 75.3412 },
  "Rajasthan": { lat: 27.0238, lng: 74.2179 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  "Telangana": { lat: 18.1124, lng: 79.0193 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  "West Bengal": { lat: 22.9868, lng: 87.8550 }
};

export const askAdvisory = async (req, res, next) => {
  try {
    const { question, language, state, crop, history } = req.body;
    let sessionId = req.body.session_id || crypto.randomUUID();

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let envData = null;
    try {
      // For general advisory, if state isn't explicitly provided, default to Maharashtra to prevent crash
      const safeState = state || "Maharashtra";
      const coords = STATE_COORDS[safeState] || STATE_COORDS["Maharashtra"];
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,precipitation_sum&current=soil_moisture_0_to_7cm&timezone=Asia/Kolkata`;
      const response = await axios.get(meteoUrl);
      envData = {
        soil_moisture: response.data.current.soil_moisture_0_to_7cm,
        precipitation: response.data.daily.precipitation_sum[0] || 0,
        temp: response.data.daily.temperature_2m_max[0] || 35
      };
    } catch (e) {
      console.log('Failed to fetch weather data for advisory:', e.message);
    }

    const context = { state, crop, price: null, msp: null, envData }; 
    const responseText = await getAdvisory(question, context, language || 'hi', history || []);

    try {
      await db.query(
        `INSERT INTO advisory_logs (session_id, question, response, language, state, crop)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, question, responseText, language, state, crop]
      );
    } catch (dbError) {
      console.error('Failed to log advisory:', dbError);
    }

    res.json({ response: responseText, session_id: sessionId });
  } catch (error) {
    next(error);
  }
};
