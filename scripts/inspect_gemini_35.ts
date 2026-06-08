import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log("Calling gemini-3.5-flash with responseModalities AUDIO...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello, say hi!",
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore"
            }
          }
        }
      }
    });

    console.log("Response candidates:", JSON.stringify(response.candidates, null, 2));
  } catch (err: any) {
    console.error("Error caught:", err);
  }
}

run();
