import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export async function translateText(text, targetLanguage) {
  if (!process.env.GEMINI_API_KEY) {
      return text;
  }
  
  if (!text || targetLanguage === 'en') return text;

  try {
    if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Translate the following text to language code '${targetLanguage}' (return ONLY the translated text, no markdown, no quotes, no conversational filler):\n\n${text}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error translating text with Gemini:', error.message);
    return text; // Fallback to original
  }
}
