import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async getVenueRecommendations(budget: number, location: string, theme: string, guestCount: number) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 3 unique venue types for a ${theme} event in ${location} with a budget of $${budget} for ${guestCount} guests. Provide name, estimated cost, and why it fits the theme. Return in JSON format.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "[]");
  },

  async generateInvitation(eventDetails: any) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a creative and modern invitation text for the following event: ${JSON.stringify(eventDetails)}. Use a Gen-Z aesthetic with emojis and a catchy headline.`,
    });
    return response.text;
  },

  async chatAssistant(message: string, history: { role: string, parts: string }[]) {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "You are Plan-It AI, a helpful and trendy event planning assistant. You help users find venues, plan budgets, and generate creative ideas for their events. Use a friendly, modern tone with emojis.",
      },
    });
    
    // Note: sendMessage only accepts the message parameter
    const response = await chat.sendMessage({ message });
    return response.text;
  }
};
