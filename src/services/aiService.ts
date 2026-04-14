import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Helper to get the API key
const getApiKey = () => {
  const key = (process.env.GEMINI_API_KEY as string) || 
              (import.meta.env?.VITE_GEMINI_API_KEY as string) || 
              "";
  
  if (!key) {
    throw new Error("AI API Key is missing. \n\nTo fix this:\n\nOn Localhost:\n1. Create a '.env' file.\n2. Add 'VITE_GEMINI_API_KEY=your_key'\n\nOn Vercel:\n1. Go to Project Settings > Environment Variables.\n2. Add 'VITE_GEMINI_API_KEY' with your Gemini API key.\n3. Redeploy your app.");
  }
  return key;
};

// Helper to handle AI calls with retry logic and better error messages
async function callAiWithRetry(fn: (useLite?: boolean) => Promise<any>, retries = 6, delay = 3000, useLite = true): Promise<any> {
  try {
    return await fn(useLite);
  } catch (error: any) {
    const errorMsg = error.message || "";
    const errorStatus = error.status || "";
    
    const isRateLimit = errorMsg.includes("429") || errorStatus === "RESOURCE_EXHAUSTED";
    const isTransient = errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || 
                        errorMsg.includes("500") || errorMsg.includes("INTERNAL") ||
                        errorStatus === "UNAVAILABLE" || errorStatus === "INTERNAL";
    
    if ((isRateLimit || isTransient) && retries > 0) {
      const reason = isRateLimit ? "Quota/Rate Limit" : "Transient Service Error";
      console.warn(`⚠️ AI Service: ${reason}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callAiWithRetry(fn, retries - 1, delay * 1.5, useLite);
    }
    
    // If Lite failed after all retries, try one last time with standard Flash (different quota pool)
    if ((isRateLimit || isTransient) && useLite) {
      console.warn("⚠️ AI Service: Lite model issue. Falling back to standard Flash...");
      return callAiWithRetry(fn, 2, 1000, false);
    }
    
    if (isRateLimit) {
      throw new Error("AI Quota Exceeded: The shared system is currently at maximum capacity. Please try again in a few minutes. ⏳");
    }

    if (isTransient) {
      throw new Error("AI Service Temporarily Unavailable: The AI model is currently overloaded or having a hiccup. Please try again in a few seconds. 🛠️");
    }
    
    throw error;
  }
}

export const aiService = {
  async getVenueRecommendations(budget: number, location: string, theme: string, guestCount: number) {
    return callAiWithRetry(async (useLite) => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: useLite ? "gemini-3.1-flash-lite-preview" : "gemini-flash-latest",
        contents: `Suggest 3 unique venue types for a ${theme} event in ${location} with a budget of ₹${budget} for ${guestCount} guests. Provide name, estimated cost in ₹, and why it fits the theme. Return in JSON format.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      return JSON.parse(response.text || "[]");
    });
  },

  async generateInvitation(eventDetails: any) {
    return callAiWithRetry(async (useLite) => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: useLite ? "gemini-3.1-flash-lite-preview" : "gemini-flash-latest",
        contents: `Generate a creative and modern invitation text for the following event: ${JSON.stringify(eventDetails)}. Use a Gen-Z aesthetic with emojis and a catchy headline.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      return response.text;
    });
  },

  async chatAssistant(message: string, history: any[]) {
    return callAiWithRetry(async (useLite) => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: useLite ? "gemini-3.1-flash-lite-preview" : "gemini-flash-latest",
        config: {
          systemInstruction: "You are Plan-It AI, a helpful and trendy event planning assistant. You help users find venues, plan budgets, and generate creative ideas for their events. Use a friendly, modern tone with emojis.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      });
      
      const response = await chat.sendMessage({ message });
      return response.text;
    });
  },

  async getStructuredPlan(eventDetails: any) {
    return callAiWithRetry(async (useLite) => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: useLite ? "gemini-3.1-flash-lite-preview" : "gemini-flash-latest",
        contents: `Based on these event details: ${JSON.stringify(eventDetails)}, generate a professional, industry-standard event plan in JSON format. 
        
        CRITICAL CONSTRAINT: The total budget provided is exactly ₹${eventDetails.budget}. 
        The sum of all "estimatedCost" values in the "budgetBreakdown" MUST be exactly ₹${eventDetails.budget}. 
        Do NOT hallucinate a larger budget. Even if the budget seems low for the event type, distribute the ₹${eventDetails.budget} proportionally across categories.
        
        All costs must be in Indian Rupees (₹).
        Include:
        1. "themes": An array of 3 unique theme names and descriptions.
        2. "budgetBreakdown": An array of objects with "category", "estimatedCost" (NUMBER ONLY, no strings), and "priority" (High/Medium/Low).
        3. "checklist": An array of objects with "task" and "timeline" (e.g., "6 months before", "1 month before", "1 week before", "Day of event").
        
        Return ONLY the JSON object.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      return JSON.parse(response.text || "{}");
    });
  },

  async getHotelRecommendations(location: string, guestCount: number, theme: string) {
    return callAiWithRetry(async (useLite) => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: useLite ? "gemini-3.1-flash-lite-preview" : "gemini-flash-latest",
        contents: `Suggest 3 real luxury hotels in ${location} that would be suitable for a ${theme} event with ${guestCount} guests. 
        For each hotel, provide:
        - "name": Full name of the hotel.
        - "description": A brief 1-2 sentence description.
        - "spaces": An array of objects with "type" (e.g., "Grand Ballroom", "Rooftop Garden", "Poolside Deck") and "capacity" (number of guests).
        - "amenities": An array of 3-4 key amenities.
        - "estimatedPrice": A starting price in ₹ for booking a space.
        
        Return the result in JSON format as an array of objects.
        Return ONLY the JSON array.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      return JSON.parse(response.text || "[]");
    });
  },

  async generateScavengerHunt(eventDetails: any) {
    return callAiWithRetry(async (useLite) => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: useLite ? "gemini-3.1-flash-lite-preview" : "gemini-flash-latest",
        contents: `Create a fun and interactive scavenger hunt for a ${eventDetails.type} event with the theme "${eventDetails.theme || 'General'}". 
        The location is ${eventDetails.location}.
        
        Generate 8-10 creative "missions" or "items to find" that guests can do during the event. 
        Missions should be a mix of:
        - Social (e.g., "Find someone who...")
        - Visual (e.g., "Take a photo of...")
        - Hidden (e.g., "Find the secret...")
        
        Return the result in JSON format as an array of objects with "id", "mission", "description", and "points".
        
        Return ONLY the JSON array.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });
      return JSON.parse(response.text || "[]");
    });
  }
};
