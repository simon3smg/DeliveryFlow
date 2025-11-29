import { GoogleGenAI } from "@google/genai";
import { Delivery, Store } from "../types";

export const generateDeliveryReportInsight = async (
  deliveries: Delivery[],
  stores: Store[],
  month: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const storeNames = stores.map(s => s.name).join(", ");
  const deliveryCount = deliveries.length;
  const totalValue = deliveries.reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.priceAtDelivery * i.quantity), 0), 0);
  
  // Calculate specific totals including pending cash
  const cashReceived = deliveries
    .filter(d => d.paymentMethod === 'cash' && d.paymentStatus !== 'pending')
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

  const pendingCash = deliveries
    .filter(d => d.paymentMethod === 'cash' && d.paymentStatus === 'pending')
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

  const creditGiven = deliveries
    .filter(d => d.paymentMethod !== 'cash')
    .reduce((acc, d) => acc + d.items.reduce((s, i) => s + (i.quantity * i.priceAtDelivery), 0), 0);

  // Simplified data for prompt to save tokens
  const summaryData = {
    month,
    totalDeliveries: deliveryCount,
    totalRevenue: totalValue.toFixed(2),
    cashCollected: cashReceived.toFixed(2),
    cashPendingCollection: pendingCash.toFixed(2),
    creditGiven: creditGiven.toFixed(2),
    activeStores: storeNames,
    topItems: deliveries.flatMap(d => d.items).slice(0, 10) // Just a sample
  };

  const prompt = `
    Act as a logistics and sales analyst.
    Analyze the following delivery summary for the month of ${month}.
    
    Data: ${JSON.stringify(summaryData)}

    Please provide a concise executive summary (max 150 words) highlighting:
    1. Overall performance.
    2. Cash Flow analysis (Specifically note any significant pending cash collections).
    3. Any suggestions for optimization based on general retail logistics best practices.
    
    Keep the tone professional and encouraging.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insight generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate insight due to an API error.";
  }
};