/**
 * Gemini API Integration
 * Handles both LLM calls and video generation via Gemini/Veo
 */

import { ENV } from "./env.js";

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
  }>;
}

/**
 * Call Gemini API for text generation
 */
export async function callGemini(
  messages: GeminiMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const apiKey = ENV.geminiApiKey || ENV.forgeApiKey;
  
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const request: GeminiRequest = {
    contents: messages,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API");
    }

    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    console.error("[Gemini] Error:", error);
    throw error;
  }
}

/**
 * Generate video using Gemini Veo
 */
export async function generateVideoWithVeo(prompt: string): Promise<{
  videoUrl: string;
  duration: number;
}> {
  const apiKey = ENV.geminiApiKey || ENV.forgeApiKey;
  
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  // Note: Veo 3.1 API endpoint (this is a placeholder - actual endpoint may differ)
  // Check latest Gemini docs for the correct video generation endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateVideo?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        duration: 8, // Veo 3.1 generates 8-second videos
        resolution: "720p",
        includeAudio: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Veo API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      videoUrl: data.videoUrl || data.url,
      duration: data.duration || 8,
    };
  } catch (error) {
    console.error("[Veo] Error:", error);
    throw error;
  }
}

/**
 * Convert OpenAI-style messages to Gemini format
 */
export function convertToGeminiMessages(
  messages: Array<{ role: string; content: string }>
): GeminiMessage[] {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}
