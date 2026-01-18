
import { GoogleGenAI, Type } from "@google/genai";
import { TileData } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAiHint(board: (TileData | null)[][]): Promise<{ r1: number, c1: number, r2: number, c2: number, comment: string } | null> {
  const boardSnapshot = board.map((row, r) => row.map((tile, c) => ({
      type: tile?.type || 'EMPTY',
      locked: tile?.locked || false,
      special: tile?.special || 'NONE'
  })));
  
  const prompt = `
    I am playing "Desi Feast", a match-3 game. The board is 8x8.
    Tiles: BHAAT (Rice), DAAL (Lentils), SHOBJIE (Veg), RUTI (Bread), BEGUN_BHORTHA (Eggplant), ALU_BHORTHA (Potato), CHICKEN_BIRYANI.
    
    Current Board Snapshot:
    ${JSON.stringify(boardSnapshot)}

    Task: Find a valid adjacent swap to make a 3+ match. 
    Role: You are a wise, caring, and funny Bangladeshi Dadi (Grandmother).
    
    Guidelines:
    1. Encourage specific food pairings (e.g., "Match the Daal with Bhaat, beta!").
    2. Use Hinglish/Bengali slang: 'Oma!', 'Khub bhalo', 'Jaldi koro', 'Arre wah!', 'Chele/Meye amar'.
    3. If there is a match-4 or match-5 possible, be VERY excited!
    
    Output JSON ONLY:
    {
      "r1": row, "c1": col, "r2": targetRow, "c2": targetCol,
      "comment": "Dadi's enthusiastic advice"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            r1: { type: Type.NUMBER },
            c1: { type: Type.NUMBER },
            r2: { type: Type.NUMBER },
            c2: { type: Type.NUMBER },
            comment: { type: Type.STRING }
          },
          required: ["r1", "c1", "r2", "c2", "comment"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Hint Error:", error);
    return null;
  }
}
