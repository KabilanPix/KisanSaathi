import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/alert', async (req, res) => {
  try {
    const { lat, lon, lang = 'hi' } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    let temperature;
    let condition;
    let description;
    let locationName = 'Your Area';
    let useOpenMeteo = true;

    if (process.env.OPENWEATHER_API_KEY) {
      try {
        const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
        const weatherRes = await axios.get(openWeatherUrl);
        temperature = weatherRes.data.main.temp;
        condition = weatherRes.data.weather[0].main; // e.g. "Clear", "Rain", "Clouds"
        description = weatherRes.data.weather[0].description; // e.g. "scattered clouds"
        locationName = weatherRes.data.name || 'Your Area';
        useOpenMeteo = false;
      } catch (err) {
        console.warn('OpenWeather API failed, falling back to Open-Meteo:', err.message);
        useOpenMeteo = true;
      }
    } 
    
    if (useOpenMeteo) {
      // Fallback to free Open-Meteo
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const meteoRes = await axios.get(meteoUrl);
      temperature = meteoRes.data.current_weather.temperature;
      condition = meteoRes.data.current_weather.weathercode === 0 ? 'Clear' : 'Clouds'; // Simplified fallback
      description = `WMO Code: ${meteoRes.data.current_weather.weathercode}`;
      
      // Free reverse geocoding for Open-Meteo
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        const geoRes = await axios.get(geoUrl, { headers: { 'User-Agent': 'KisanSaathi/1.0' } });
        if (geoRes.data && geoRes.data.address) {
          const addr = geoRes.data.address;
          locationName = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Your Area';
        }
      } catch (e) {
        console.warn('Nominatim reverse geocoding failed:', e.message);
      }
    }

    let recommendation = 'Favorable weather conditions for routine agricultural activities.';
    if (condition === 'Rain' || condition === 'Thunderstorm') {
      recommendation = 'Heavy rain expected. Delay pesticide spraying and ensure field drainage.';
    } else if (condition === 'Clear' && temperature > 35) {
      recommendation = 'High temperatures detected. Ensure adequate crop irrigation.';
    } else if (condition === 'Snow') {
      recommendation = 'Protect sensitive crops from frost damage.';
    } else if (condition === 'Fog') {
      recommendation = 'Low visibility and high humidity. Monitor for fungal diseases.';
    }

    res.json({
      locationName,
      temperature,
      condition,
      recommendation
    });
  } catch (err) {
    console.error('Weather route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather alerts' });
  }
});

export default router;
