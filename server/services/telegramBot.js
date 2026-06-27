import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { parseTelegramQuery, translateTelegramResponse } from './geminiService.js';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Initialize bot if token is present
let bot;
if (token) {
  bot = new TelegramBot(token, { polling: true });
}

const MSP_2024_25 = {
  "Wheat": 2275,
  "Rice": 2300,
  "Maize": 2090,
  "Jowar": 3371,
  "Bajra": 2625,
  "Ragi": 4290,
  "Tur (Arhar)": 7550,
  "Moong": 8682,
  "Urad": 7400,
  "Groundnut": 6783,
  "Sunflower": 7280,
  "Soybean": 4892,
  "Sugarcane": 340,
  "Cotton (Medium)": 7121,
  "Cotton (Long)": 7521,
  "Jute": 5335,
  "Mustard": 5950,
  "Safflower": 5800
};

const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

if (bot) {
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text || text.startsWith('/')) {
      if (text === '/start') {
        bot.sendMessage(chatId, `🌱 *Welcome to KisanSaathi Bot!*\n\nType a crop and your district to get live Mandi prices.\n\n*Example:* \`Wheat Indore\` or \`Tomato Hosur\``, { parse_mode: 'Markdown' });
      }
      return;
    }

    bot.sendMessage(chatId, `🧠 Analyzing your request...`, { parse_mode: 'Markdown' });

    let commodity = '';
    let district = '';
    let detectedLanguage = 'English';

    try {
      const aiParsed = await parseTelegramQuery(text);
      if (aiParsed && aiParsed.commodity && aiParsed.district) {
        commodity = aiParsed.commodity;
        district = aiParsed.district;
        detectedLanguage = aiParsed.language || 'English';
      } else {
        // Fallback to simple split if AI fails
        const parts = text.split(' ');
        if (parts.length < 2) {
          bot.sendMessage(chatId, '⚠️ Please provide both a crop and a district.\n*Example:* `Wheat Indore`', { parse_mode: 'Markdown' });
          return;
        }
        commodity = parts[0];
        district = parts.slice(1).join(' ');
      }
    } catch (e) {
      console.error("AI parse error:", e);
      // Fallback
      const parts = text.split(' ');
      if (parts.length < 2) {
        bot.sendMessage(chatId, '⚠️ Please provide both a crop and a district.\n*Example:* `Wheat Indore`', { parse_mode: 'Markdown' });
        return;
      }
      commodity = parts[0];
      district = parts.slice(1).join(' ');
    }

    if (!process.env.DATA_GOV_API_KEY) {
      bot.sendMessage(chatId, `⚠️ Data.gov.in API key is missing on the server.`);
      return;
    }

    bot.sendMessage(chatId, `🔍 Fetching live mandi prices for *${commodity}* in *${district}*...`, { parse_mode: 'Markdown' });

    try {
      // Direct call to Data.gov API
      const response = await axios.get(BASE_URL, {
        params: {
          'api-key': process.env.DATA_GOV_API_KEY,
          format: 'json',
          'filters[commodity]': commodity,
          'filters[district]': district
        }
      });

      const records = response.data.records || [];

      if (records.length === 0) {
        const errorReply = `❌ Sorry, no live market data found for *${commodity}* in *${district}* today.`;
        const translatedError = await translateTelegramResponse(errorReply, detectedLanguage);
        bot.sendMessage(chatId, translatedError, { parse_mode: 'Markdown' });
        return;
      }

      // Sort to find the highest price market (best for farmer)
      records.sort((a, b) => parseFloat(b.modal_price) - parseFloat(a.modal_price));
      const bestMarket = records[0];
      const currentPrice = parseFloat(bestMarket.modal_price);

      // Check against MSP
      // Standardize casing for lookup
      const mspKey = Object.keys(MSP_2024_25).find(k => k.toLowerCase() === commodity.toLowerCase());
      const msp = mspKey ? MSP_2024_25[mspKey] : null;

      let mspMessage = '';
      if (msp) {
        const diff = currentPrice - msp;
        if (diff > 0) {
          mspMessage = `\n✅ This is *₹${diff} ABOVE* the Govt MSP (₹${msp}/qtl). Good time to sell!`;
        } else if (diff < 0) {
          mspMessage = `\n⚠️ This is *₹${Math.abs(diff)} BELOW* the Govt MSP (₹${msp}/qtl). Consider holding or seeking MSP centers.`;
        } else {
          mspMessage = `\n⚖️ This is exactly the Govt MSP (₹${msp}/qtl).`;
        }
      } else {
        mspMessage = `\nℹ️ (No Govt MSP defined for this crop)`;
      }

      const reply = `🌾 **${bestMarket.commodity} Prices in ${bestMarket.district}**\n\n` +
                    `📍 Best Market: ${bestMarket.market}\n` +
                    `💰 Current Price: *₹${bestMarket.modal_price}/qtl*\n` +
                    `📉 Min: ₹${bestMarket.min_price} | 📈 Max: ₹${bestMarket.max_price}\n` +
                    mspMessage;

      const finalReply = await translateTelegramResponse(reply, detectedLanguage);
      bot.sendMessage(chatId, finalReply, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Telegram bot API error:', error.message);
      bot.sendMessage(chatId, `❌ Failed to fetch data from the server. Please try again later.`);
    }
  });

  console.log('✅ Telegram Bot initialized and listening...');
} else {
  console.log('⚠️ TELEGRAM_BOT_TOKEN not found in .env. Telegram bot is disabled.');
}

export default bot;
