import { BedrockRuntimeClient, ConverseCommand, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import { globalCache } from '../utils/cache.js';
import {
  getAdvisorySystemInstruction,
  getInsuranceAdvicePrompt,
  getWeatherRecommendationPrompt,
  getParseTelegramQueryPrompt,
  getTranslateTelegramResponsePrompt,
  getCostTrackerAdvicePrompt
} from './prompts.js';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const DEFAULT_MODEL_ID = "amazon.nova-lite-v1:0";
const FALLBACK_MODEL_ID = "amazon.titan-text-premier-v1:0";

const LANG_MAP = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', pa: 'Punjabi', ta: 'Tamil', te: 'Telugu', kn: 'Kannada', bn: 'Bengali', ml: 'Malayalam'
};

function sanitizeInput(text) {
  if (!text) return text;
  // Basic prompt injection protection
  return text.replace(/ignore all previous instructions/gi, "[REDACTED]")
             .replace(/you are now a/gi, "[REDACTED]");
}

async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      const isThrottling = error.name === 'ThrottlingException' || error.message.includes('ThrottlingException');
      if (isThrottling && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 500; // jitter
        console.warn(`ThrottlingException caught, retrying in ${Math.round(delay)}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
}

async function invokeBedrock(systemText, messages, modelId = DEFAULT_MODEL_ID, toolConfig = undefined) {
  if (!client) throw new Error("AWS Bedrock client not configured.");
  let command = new ConverseCommand({
    modelId: modelId,
    system: systemText ? [{ text: systemText }] : undefined,
    messages: messages,
    toolConfig: toolConfig
  });
  
  let response;
  try {
    response = await withRetry(() => client.send(command));
  } catch (error) {
    console.warn(`Primary model ${modelId} failed. Falling back to ${FALLBACK_MODEL_ID}. Error: ${error.message}`);
    command = new ConverseCommand({
      modelId: FALLBACK_MODEL_ID,
      system: systemText ? [{ text: systemText }] : undefined,
      messages: messages,
      toolConfig: toolConfig
    });
    response = await client.send(command);
  }
  
  // Handle tool use responses if a tool was forced
  if (toolConfig && response.output?.message?.content) {
    const toolUse = response.output.message.content.find(c => c.toolUse);
    if (toolUse) {
      return toolUse.toolUse.input;
    }
  }
  
  return response.output.message.content[0].text;
}

export async function getAdvisory(question, context, language, history = [], imageBuffer = null, imageFormat = 'jpeg', modelId = DEFAULT_MODEL_ID) {
  if (!client) {
    return "I am currently unable to provide advice as my AI is not configured. Please add the AWS Bedrock API key.";
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';
  const systemInstruction = getAdvisorySystemInstruction(context, fullLangName);
  const sanitizedQuestion = sanitizeInput(question);

  let safeHistory = history.map(m => ({
    role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
    content: [{ text: m.content }]
  }));

  if (safeHistory.length > 0 && safeHistory[0].role !== 'user') {
    safeHistory.shift();
  }

  const userContent = [];
  if (imageBuffer) {
    userContent.push({
      image: {
        format: imageFormat,
        source: { bytes: imageBuffer }
      }
    });
  }
  userContent.push({ text: sanitizedQuestion });

  const messages = [...safeHistory, { role: "user", content: userContent }];

  try {
    return await invokeBedrock(systemInstruction, messages, modelId);
  } catch (error) {
    console.error('AWS Bedrock error:', error.message);
    const isThrottling = error.name === 'ThrottlingException' || error.message.includes('ThrottlingException');
    if (isThrottling) {
      return `[Mock AI Response - API Quota Exceeded]: For ${context.crop || 'your crop'} in ${context.state || 'your state'}, it's advisable to check the weather before applying inputs. Since you asked "${sanitizedQuestion}", consider consulting local agriculture extension officers for precise guidance.`;
    }
    return "Sorry, I am facing technical difficulties connecting to the AI. Please try again later.";
  }
}

export async function* getAdvisoryStream(question, context, language, history = [], imageBuffer = null, imageFormat = 'jpeg', modelId = DEFAULT_MODEL_ID) {
  if (!client) {
    yield "I am currently unable to provide advice as my AI is not configured.";
    return;
  }

  const fullLangName = LANG_MAP[language] || 'Hindi';
  const systemInstruction = getAdvisorySystemInstruction(context, fullLangName);
  const sanitizedQuestion = sanitizeInput(question);

  let safeHistory = history.map(m => ({
    role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
    content: [{ text: m.content }]
  }));
  if (safeHistory.length > 0 && safeHistory[0].role !== 'user') safeHistory.shift();

  const userContent = [];
  if (imageBuffer) {
    userContent.push({
      image: { format: imageFormat, source: { bytes: imageBuffer } }
    });
  }
  userContent.push({ text: sanitizedQuestion });

  const messages = [...safeHistory, { role: "user", content: userContent }];

  let command = new ConverseStreamCommand({
    modelId: modelId,
    system: [{ text: systemInstruction }],
    messages: messages
  });

  try {
    let response;
    try {
      response = await withRetry(() => client.send(command));
    } catch (error) {
      console.warn(`Primary model ${modelId} failed in stream. Falling back to ${FALLBACK_MODEL_ID}. Error: ${error.message}`);
      command = new ConverseStreamCommand({
        modelId: FALLBACK_MODEL_ID,
        system: [{ text: systemInstruction }],
        messages: messages
      });
      response = await client.send(command);
    }
    
    for await (const chunk of response.stream) {
      if (chunk.contentBlockDelta?.delta?.text) {
        yield chunk.contentBlockDelta.delta.text;
      }
    }
  } catch (error) {
    console.error('AWS Bedrock stream error:', error.message);
    yield " Sorry, I am facing technical difficulties connecting to the AI.";
  }
}

export async function getInsuranceAdvice(state, district, crop, season, acres, language, envData, modelId = DEFAULT_MODEL_ID) {
  if (!client) {
    return JSON.stringify({ risk_level: "Medium", advice: "I am currently unable to provide insurance advice as my AI is not configured." });
  }
  
  const cacheKey = `insurance_${state}_${district}_${crop}_${season}_${acres}_${language}`;
  const cached = globalCache.get(cacheKey);
  if (cached && !envData) return cached; // Don't cache if there's live envData influencing it

  const fullLangName = LANG_MAP[language] || 'Hindi';
  const prompt = getInsuranceAdvicePrompt(state, district, crop, season, acres, envData, fullLangName);

  const toolConfig = {
    tools: [{
      toolSpec: {
        name: "output_insurance_advice",
        description: "Output the insurance advice strictly as a JSON object.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              risk_level: { type: "string", enum: ["Low", "Medium", "High"] },
              advice: { type: "string" }
            },
            required: ["risk_level", "advice"]
          }
        }
      }
    }],
    toolChoice: { tool: { name: "output_insurance_advice" } }
  };

  try {
    const result = await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }], modelId, toolConfig);
    const jsonStr = JSON.stringify(result);
    if (!envData) globalCache.set(cacheKey, jsonStr);
    return jsonStr;
  } catch (error) {
    console.error('AWS Bedrock error:', error.message);
    const isThrottling = error.name === 'ThrottlingException' || error.message.includes('ThrottlingException');
    if (isThrottling) {
      return JSON.stringify({
        risk_level: "Medium",
        advice: `[Mock AI Response - API Quota Exceeded]:\n1. Scheme: Pradhan Mantri Fasal Bima Yojana (PMFBY) covers ${crop} in ${state}.\n2. Premium: Typically 2% for Kharif, 1.5% for Rabi, and 5% for commercial/horticultural crops.\n3. Documents: Aadhar, Land Record (7/12), Bank Passbook, Sowing Certificate.\n4. Enrollment: Visit nearest CSC center or bank branch with documents before cutoff date.\n5. Claims: Report crop loss within 72 hours via the Crop Insurance App or toll-free number.`
      });
    }
    return JSON.stringify({ risk_level: "Medium", advice: "Sorry, I am facing technical difficulties connecting to the AI. Please try again later." });
  }
}

export async function getWeatherRecommendation(temp, conditionDescription, language, modelId = DEFAULT_MODEL_ID) {
  if (!client) {
    return "Weather recommendation unavailable (No API key).";
  }

  const cacheKey = `weather_${temp}_${conditionDescription}_${language}`;
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const fullLangName = LANG_MAP[language] || 'Hindi';
  const prompt = getWeatherRecommendationPrompt(temp, conditionDescription, fullLangName);

  try {
    const response = await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }], modelId);
    globalCache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('AWS Bedrock weather error:', error.message);
    return "Check your crops regularly and follow local weather advisories.";
  }
}

export async function parseTelegramQuery(text, modelId = DEFAULT_MODEL_ID) {
  if (!client) {
    return null;
  }

  const sanitizedText = sanitizeInput(text);
  const prompt = getParseTelegramQueryPrompt(sanitizedText);

  const toolConfig = {
    tools: [{
      toolSpec: {
        name: "output_parsed_query",
        description: "Output the parsed query strictly as a JSON object.",
        inputSchema: {
          json: {
            type: "object",
            properties: {
              language: { type: "string" },
              commodity: { type: "string" },
              district: { type: "string" }
            },
            required: ["language", "commodity", "district"]
          }
        }
      }
    }],
    toolChoice: { tool: { name: "output_parsed_query" } }
  };

  try {
    return await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }], modelId, toolConfig);
  } catch (error) {
    console.error('AWS Bedrock parseTelegramQuery error:', error.message);
    return null;
  }
}

export async function translateTelegramResponse(text, targetLanguage, modelId = DEFAULT_MODEL_ID) {
  if (!client || !targetLanguage || targetLanguage.toLowerCase() === 'english') {
    return text;
  }
  
  // Base64 encoding the text to create a safe cache key
  const cacheKey = `translate_${Buffer.from(text).toString('base64').substring(0, 50)}_${targetLanguage}`;
  const cached = globalCache.get(cacheKey);
  if (cached) return cached;

  const prompt = getTranslateTelegramResponsePrompt(text, targetLanguage);

  try {
    const response = await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }], modelId);
    globalCache.set(cacheKey, response);
    return response;
  } catch (error) {
    console.error('AWS Bedrock translateTelegramResponse error:', error.message);
    return text; // fallback to English
  }
}

export async function getCostTrackerAdvice(summary, language, modelId = DEFAULT_MODEL_ID) {
  if (!client) {
    return "AI is not configured. Please add the AWS Bedrock API key.";
  }
  const fullLangName = LANG_MAP[language] || 'Hindi';
  const prompt = getCostTrackerAdvicePrompt(summary, fullLangName);

  try {
    return await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }], modelId);
  } catch (error) {
    console.error('AWS Bedrock getCostTrackerAdvice error:', error.message);
    return "Check your major expenses and consult local extension officers for cost-saving techniques.";
  }
}
