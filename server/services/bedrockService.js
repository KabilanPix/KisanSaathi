import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

// The AWS SDK automatically picks up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY 
// from your environment variables (.env file).
const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const MODEL_ID = "amazon.nova-lite-v1:0";

const LANG_MAP = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', pa: 'Punjabi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali', ml: 'Malayalam'
};

async function invokeBedrock(systemText, messages) {
  if (!client) throw new Error("AWS Bedrock client not configured.");
  const command = new ConverseCommand({
    modelId: MODEL_ID,
    system: systemText ? [{ text: systemText }] : undefined,
    messages: messages
  });
  const response = await client.send(command);
  return response.output.message.content[0].text;
}

export async function getAdvisory(question, context, language, history = []) {
  if (!client) {
    return "I am currently unable to provide advice as my AI is not configured. Please add the AWS Bedrock API key.";
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';

  let systemInstruction = `You are KisanSaathi, an expert agricultural scientist and financial advisor for Indian agriculture, farming, crops, and related policies.
    Always respond in ${fullLangName}. Provide highly detailed, step-by-step, and comprehensive explanations. Use bold headings, bullet points, and spacing to make your response easy to read.
    When asked about a crop, cover the entire lifecycle if relevant (land preparation, sowing, irrigation, fertilizers, pest control, and harvesting). Always emphasize maximizing yield and minimizing input costs to ensure income stability. Explain *why* certain actions should be taken, rather than just stating *what* to do.
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

  // Ensure first message is user
  let safeHistory = history.map(m => ({
    role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
    content: [{ text: m.content }]
  }));

  if (safeHistory.length > 0 && safeHistory[0].role !== 'user') {
    safeHistory.shift();
  }

  const messages = [...safeHistory, { role: "user", content: [{ text: question }] }];

  try {
    return await invokeBedrock(systemInstruction, messages);
  } catch (error) {
    console.error('AWS Bedrock error:', error.message);
    if (error.message.includes('ThrottlingException')) {
      return `[Mock AI Response - API Quota Exceeded]: For ${context.crop || 'your crop'} in ${context.state || 'your state'}, it's advisable to check the weather before applying inputs. Since you asked "${question}", consider consulting local agriculture extension officers for precise guidance.`;
    }
    return "Sorry, I am facing technical difficulties connecting to the AI. Please try again later.";
  }
}

export async function getInsuranceAdvice(state, district, crop, season, acres, language, envData) {
  if (!client) {
    return JSON.stringify({ risk_level: "Medium", advice: "I am currently unable to provide insurance advice as my AI is not configured." });
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';

  let prompt = `You are KisanSaathi, an expert agricultural insurance advisor for Indian farmers. Respond in ${fullLangName}. Use markdown formatting with bold headings and bullet points for readability.
  A farmer in ${district ? `${district}, ` : ''}${state} is growing ${crop} in ${season} season on ${acres} acres.
  Provide a deep dive into the PMFBY (Pradhan Mantri Fasal Bima Yojana) scheme applicable to them.
  Detail the following comprehensively:
  1) Exact PMFBY scheme details for this crop and state.
  2) Estimated premium calculation based on the acreage.
  3) Detailed list of required documents and *where* they can obtain them (e.g., 7/12 from Patwari).
  4) Step-by-step enrollment process.
  5) Highly detailed claim filing process (timeline, who to contact, how crop cutting experiments work).
  6) What to do if a claim is delayed or rejected.
  If asked about extremely specific edge cases, provide the Kisan Call Center (KCC) toll-free number: 1800-180-1551.
  
  RETURN YOUR RESPONSE AS RAW JSON WITH NO MARKDOWN FORMATTING OR BACKTICKS AROUND THE ENTIRE OBJECT EXACTLY LIKE THIS:
  {"risk_level": "High", "advice": "your markdown formatted detailed advice here"}`;

  if (envData) {
    prompt += `\n\nSATELLITE & WEATHER DATA FOR ${district ? district : state}: 
    - Soil Moisture (0-7cm): ${envData.soil_moisture}% 
    - Recent Daily Rainfall: ${envData.precipitation} mm
    - Max Temperature: ${envData.temp}°C
    Based on this LIVE environmental data, proactively suggest if the farmer is at risk and should file a claim under PMFBY (e.g. for drought if moisture is low, or for excess rainfall). Include this naturally in your advice.`;
  }

  try {
    let result = await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }]);
    // Strip markdown JSON block if model returned it
    if (result.startsWith('```json')) {
      result = result.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    return result.trim();
  } catch (error) {
    console.error('AWS Bedrock error:', error.message);
    if (error.message.includes('ThrottlingException')) {
      return JSON.stringify({
        risk_level: "Medium",
        advice: `[Mock AI Response - API Quota Exceeded]:\n1. Scheme: Pradhan Mantri Fasal Bima Yojana (PMFBY) covers ${crop} in ${state}.\n2. Premium: Typically 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops.\n3. Documents: Aadhar, Land Record (7/12), Bank Passbook, Sowing Certificate.\n4. Enrollment: Visit nearest CSC center or bank branch with documents before cutoff date.\n5. Claims: Report crop loss within 72 hours via the Crop Insurance App or toll-free number.`
      });
    }
    return JSON.stringify({ risk_level: "Medium", advice: "Sorry, I am facing technical difficulties connecting to the AI. Please try again later." });
  }
}

export async function getWeatherRecommendation(temp, conditionDescription, language) {
  if (!client) {
    return "Weather recommendation unavailable (No API key).";
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';

  const prompt = `You are KisanSaathi, a senior agricultural scientist. 
Current weather for the farmer: Temperature is ${temp}°C, Condition is: ${conditionDescription}.
Provide a comprehensive and detailed action plan based on this current weather.
Use bold headings and bullet points for readability.
Explain the immediate impact of this weather on soil and crops.
Detail specific preventative measures for diseases/pests associated with this weather (e.g., fungal diseases during high humidity, heat stress during high temp).
Give a clear timeline and guidelines for when to resume spraying, fertilizer application, or irrigation.
Respond STRICTLY in ${fullLangName}. Do not include English unless necessary.`;

  try {
    return await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }]);
  } catch (error) {
    console.error('AWS Bedrock weather error:', error.message);
    return "Check your crops regularly and follow local weather advisories.";
  }
}

export async function parseTelegramQuery(text) {
  if (!client) {
    return null;
  }

  const prompt = `You are an AI assistant for an Indian agriculture Telegram bot.
A user sent the following message: "${text}"

Your task is to:
1. Detect the language of the message (e.g., 'Hindi', 'Tamil', 'English', etc).
2. Identify the crop/commodity being asked for and translate it to English.
3. Identify the district/city being asked for and translate it to English.

Return ONLY a raw JSON object with no markdown formatting or backticks, exactly like this:
{"language": "detected_language", "commodity": "english_crop_name", "district": "english_district_name"}`;

  try {
    let result = await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }]);
    if (result.startsWith('```json')) {
      result = result.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (result.startsWith('```')) {
      result = result.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    return JSON.parse(result.trim());
  } catch (error) {
    console.error('AWS Bedrock parseTelegramQuery error:', error.message);
    return null;
  }
}

export async function translateTelegramResponse(text, targetLanguage) {
  if (!client || !targetLanguage || targetLanguage.toLowerCase() === 'english') {
    return text;
  }

  const prompt = `You are a translator for an agricultural bot.
Translate the following Markdown-formatted message into ${targetLanguage}.
Keep all the emojis intact. Keep the Markdown formatting intact (like bolding with ** or \`).
Only translate the text. Do not add any extra commentary.

Message to translate:
${text}`;

  try {
    return await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }]);
  } catch (error) {
    console.error('AWS Bedrock translateTelegramResponse error:', error.message);
    return text; // fallback to English
  }
}

export async function getCostTrackerAdvice(summary, language) {
  if (!client) {
    return "AI is not configured. Please add the AWS Bedrock API key.";
  }
  const fullLangName = LANG_MAP[language] || 'Hindi';

  const prompt = `You are an expert agricultural economist and financial advisor for an Indian farmer. Respond in ${fullLangName}. Use markdown formatting with bold headings and bullet points for readability.
The farmer has the following expense breakdown:
${summary.map(s => `- ${s.category}: ₹${s.total}`).join('\n')}

Based on this breakdown, provide a comprehensive financial audit of their expenses. 
Identify specific areas where costs are disproportionately high. 
Provide detailed, actionable, and practical cost-saving techniques (e.g., transition to specific organic fertilizers, leveraging government subsidies for machinery, optimized irrigation techniques).
Explain *why* these techniques will save money and improve their long-term income stability.`;

  try {
    return await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }]);
  } catch (error) {
    console.error('AWS Bedrock getCostTrackerAdvice error:', error.message);
    return "Check your major expenses and consult local extension officers for cost-saving techniques.";
  }
}
