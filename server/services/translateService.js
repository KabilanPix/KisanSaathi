import { invokeBedrock } from './bedrockService.js';

export async function translateText(text, targetLanguage) {
  if (!text || targetLanguage === 'en') return text;

  try {
    const prompt = `Translate the following text to language code '${targetLanguage}' (return ONLY the translated text, no markdown, no quotes, no conversational filler):\n\n${text}`;
    
    const result = await invokeBedrock(null, [{ role: "user", content: [{ text: prompt }] }]);
    return result.trim();
  } catch (error) {
    console.error('Error translating text with Bedrock:', error.message);
    return text; // Fallback to original
  }
}
