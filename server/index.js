import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import mandiRoutes from './routes/mandi.js';
import advisoryRoutes from './routes/advisory.js';
import insuranceRoutes from './routes/insurance.js';
import costsRoutes from './routes/costs.js';
import smsRoutes from './routes/sms.js';
import weatherRoutes from './routes/weatherRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import './services/telegramBot.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CLIENT_URL
}));
app.use(express.json());

// Initialize Database
initDb();

// Routes
app.use('/api/mandi', mandiRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/weather', weatherRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
