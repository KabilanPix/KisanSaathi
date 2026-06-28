import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const defaultModel = genAI ? genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" }) : null;

const LANG_MAP = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', pa: 'Punjabi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali', ml: 'Malayalam'
};

export async function getAdvisory(question, context, language, history = []) {
  if (!genAI) {
    return "I am currently unable to provide advice as my AI is not configured. Please add the Gemini API key.";
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';

  let systemInstruction = `You are KisanSaathi, an AI assistant strictly for Indian agriculture, farming, crops, and related policies.
    Always respond in ${fullLangName}. Keep responses practical, simple, and under 150 words.
    CRITICAL RULE: If the user asks about ANY topic outside of agriculture, farming, crops, or agricultural policies (e.g., tourism, movies, general knowledge), politely refuse to answer and state that you are exclusively an agricultural assistant.
    If asked about complex policies or highly specific issues you cannot answer reliably, provide the Kisan Call Center (KCC) toll-free number: 1800-180-1551. Let them know they can call to get help in their native language.
    Context: Farmer is in ${context.state || 'Unknown'}, growing ${context.crop || 'Unknown'}.
    Current mandi price: ₹${context.price || 'Unknown'}/quintal. MSP: ₹${context.msp || 'Unknown'}/quintal.`;

  if (context.envData) {
    systemInstruction += `\n\nLIVE WEATHER/SATELLITE DATA FOR ${context.state || 'Unknown'}:
    - Soil Moisture (0-7cm): ${context.envData.soil_moisture}% 
    - Recent Daily Rainfall: ${context.envData.precipitation} mm
    - Max Temperature: ${context.envData.temp}°C
    If the user asks about weather, rainfall, or if it's okay to plant something, strictly use this LIVE data to form your answer.`;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    systemInstruction: systemInstruction
  });

  // Ensure first message is user
  let safeHistory = history.map(m => ({
    role: m.role === "assistant" || m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  if (safeHistory.length > 0 && safeHistory[0].role !== 'user') {
    safeHistory.shift();
  }

  try {
    const chat = model.startChat({ history: safeHistory });
    const result = await chat.sendMessage(question);
    return result.response.text();
  } catch (error) {
    console.error('Gemini error:', error.message);
    if (error.message.includes('429')) {
      return `[Mock AI Response - API Quota Exceeded]: For ${context.crop || 'your crop'} in ${context.state || 'your state'}, it's advisable to check the weather before applying inputs. Since you asked "${question}", consider consulting local agriculture extension officers for precise guidance.`;
    }
    return "Sorry, I am facing technical difficulties connecting to the AI. Please try again later.";
  }
}

export async function getInsuranceAdvice(state, district, crop, season, acres, language, envData) {
  if (!genAI) {
    return JSON.stringify({ risk_level: "Medium", advice: "I am currently unable to provide insurance advice as my AI is not configured." });
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';

  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });
  let prompt = `You are KisanSaathi, an AI assistant for Indian farmers. Respond in ${fullLangName}.
  A farmer in ${district ? `${district}, ` : ''}${state} is growing ${crop} in ${season} season on ${acres} acres.
  Explain: 1) Which PM Fasal Bima Yojana scheme applies, 2) Estimated premium, 
  3) Documents needed, 4) Step-by-step enrollment, 5) How to file a claim.
  Be practical and simple. If asked about extremely specific edge cases, provide the Kisan Call Center (KCC) toll-free number: 1800-180-1551 to get help in their native language.
  
  RETURN YOUR RESPONSE AS RAW JSON WITH NO MARKDOWN FORMATTING OR BACKTICKS EXACTLY LIKE THIS:
  {"risk_level": "High", "advice": "your markdown formatted advice here"}`;

  if (envData) {
    prompt += `\n\nSATELLITE & WEATHER DATA FOR ${district ? district : state}: 
    - Soil Moisture (0-7cm): ${envData.soil_moisture}% 
    - Recent Daily Rainfall: ${envData.precipitation} mm
    - Max Temperature: ${envData.temp}°C
    Based on this LIVE environmental data, proactively suggest if the farmer is at risk and should file a claim under PMFBY (e.g. for drought if moisture is low, or for excess rainfall). Include this naturally in your advice.`;
  }

  try {
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    return jsonStr;
  } catch (error) {
    console.error('Gemini error:', error.message);
    if (error.message.includes('429')) {
      return JSON.stringify({
        risk_level: "Medium",
        advice: `[Mock AI Response - API Quota Exceeded]:\n1. Scheme: Pradhan Mantri Fasal Bima Yojana (PMFBY) covers ${crop} in ${state}.\n2. Premium: Typically 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops.\n3. Documents: Aadhar, Land Record (7/12), Bank Passbook, Sowing Certificate.\n4. Enrollment: Visit nearest CSC center or bank branch with documents before cutoff date.\n5. Claims: Report crop loss within 72 hours via the Crop Insurance App or toll-free number.`
      });
    }
    return JSON.stringify({ risk_level: "Medium", advice: "Sorry, I am facing technical difficulties connecting to the AI. Please try again later." });
  }
}

export async function getWeatherRecommendation(temp, conditionDescription, language) {
  if (!genAI) {
    return "Weather recommendation unavailable (No API key).";
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

  const prompt = `You are KisanSaathi, an AI agricultural expert. 
Current weather for the farmer: Temperature is ${temp}°C, Condition is: ${conditionDescription}.
Give a VERY brief (maximum 2 sentences) practical farming recommendation based on this weather.
For example, if it's hot and clear, suggest irrigation. If it's raining, suggest avoiding pesticide spraying.
Respond STRICTLY in ${fullLangName}. Do not include English unless necessary.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini weather error:', error.message);
    return "Check your crops regularly and follow local weather advisories.";
  }
}

export async function parseTelegramQuery(text) {
  if (!genAI) {
    return null;
  }
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `You are an AI assistant for an Indian agriculture Telegram bot.
A user sent the following message: "${text}"

Your task is to:
1. Detect the language of the message (e.g., 'Hindi', 'Tamil', 'English', etc).
2. Identify the crop/commodity being asked for and translate it to English.
3. Identify the district/city being asked for and translate it to English.

Return ONLY a raw JSON object with no markdown formatting or backticks, exactly like this:
{"language": "detected_language", "commodity": "english_crop_name", "district": "english_district_name"}`;

  try {
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Gemini parseTelegramQuery error:', error.message);
    return null;
  }
}

export async function translateTelegramResponse(text, targetLanguage) {
  if (!genAI || !targetLanguage || targetLanguage.toLowerCase() === 'english') {
    return text;
  }
  const model = defaultModel;

  const prompt = `You are a translator for an agricultural bot.
Translate the following Markdown-formatted message into ${targetLanguage}.
Keep all the emojis intact. Keep the Markdown formatting intact (like bolding with ** or \`).
Only translate the text. Do not add any extra commentary.

Message to translate:
${text}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini translateTelegramResponse error:', error.message);
    return text; // fallback to English
  }
}

export async function getCostTrackerAdvice(summary, language) {
  if (!genAI) {
    return "AI is not configured. Please add the Gemini API key.";
  }
  const model = defaultModel;
  const fullLangName = LANG_MAP[language] || 'Hindi';

  const prompt = `You are a financial advisor for an Indian farmer. Respond in ${fullLangName}.
The farmer has the following expense breakdown:
${summary.map(s => `- ${s.category}: ₹${s.total}`).join('\n')}

Based on this breakdown, provide exactly 3 concise, actionable bullet points (no more than 2 sentences each) suggesting how they can reduce costs or optimize these specific expenses. Keep it extremely practical for a smallholder Indian farmer.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini getCostTrackerAdvice error:', error.message);
    return "Check your major expenses and consult local extension officers for cost-saving techniques.";
  }
}
