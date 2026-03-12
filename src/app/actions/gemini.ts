'use server'

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeScatImage(base64Image: string) {
  try {
    const prompt = "You are a specialized veterinary assistant. Analyze this image of dog waste. Provide a JSON response containing: 'consistency' (1-7 scale), 'color' (hex code and name), 'objects_detected' (boolean), and a 'summary' (max 15 words, humorous tone)."

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ],
        config: {
            responseMimeType: "application/json",
        }
    });

    const jsonText = response.text || ""
    if (!jsonText) throw new Error("No response from AI")
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini API Error:", error)
    throw new Error("Failed to analyze image. Ensure your API key is valid.")
  }
}
