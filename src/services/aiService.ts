import { GoogleGenAI } from "@google/genai";

// Helper to get the API key
const getApiKey = () => {
  const key = (process.env.GEMINI_API_KEY as string) || 
              (import.meta.env?.VITE_GEMINI_API_KEY as string) || 
              "";
  
  // Debug logging
  if (!key) {
    console.error("❌ AI Service: No API Key found in the browser.");
  } else {
    console.log(`✅ AI Service: API Key detected! Starts with: ${key.substring(0, 4)}...`);
  }
  
  return key;
};

export const aiService = {
  async getVenueRecommendations(budget: number, location: string, theme: string, guestCount: number) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI API Key missing.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest 3 unique venue types for a ${theme} event in ${location} with a budget of ₹${budget} for ${guestCount} guests. Provide name, estimated cost in ₹, and why it fits the theme. Return in JSON format.`,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "[]");
    } catch (error) {
      console.error("AI Venue Recommendation Error:", error);
      throw error;
    }
  },

  async generateInvitation(eventDetails: any) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI API Key missing.");

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a creative and modern invitation text for the following event: ${JSON.stringify(eventDetails)}. Use a Gen-Z aesthetic with emojis and a catchy headline.`,
      });
      return response.text;
    } catch (error) {
      console.error("AI Invitation Generation Error:", error);
      throw error;
    }
  },

  async chatAssistant(message: string, history: any[]) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI API Key missing.");

    const ai = new GoogleGenAI({ apiKey });

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are Plan-It AI, a helpful and trendy event planning assistant. You help users find venues, plan budgets, and generate creative ideas for their events. Use a friendly, modern tone with emojis.",
        },
      });
      
      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (error) {
      console.error("AI Chat Assistant Error:", error);
      throw error;
    }
  },

  async getStructuredPlan(eventDetails: any) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI API Key missing.");

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these event details: ${JSON.stringify(eventDetails)}, generate a detailed event plan in JSON format. 
        All costs must be in Indian Rupees (₹).
        Include:
        1. "themes": An array of 3 unique theme names and descriptions.
        2. "budgetBreakdown": An array of objects with "category", "estimatedCost" (NUMBER ONLY, no strings), and "priority" (High/Medium/Low).
        3. "checklist": An array of objects with "task" and "timeline" (e.g., "6 months before").
        
        Return ONLY the JSON object.`,
        config: {
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Structured Plan Error:", error);
      throw error;
    }
  }
};
