import { GoogleGenAI, FunctionDeclaration, Type, FunctionCallingConfigMode } from "@google/genai";
import { PowerPlan, UsageProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Tool 1: Create Power Plan
const createPowerPlanTool: FunctionDeclaration = {
  name: "createPowerPlan",
  description: "Extracts power plan details (rates, fixed charges) from text.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the plan" },
      provider: { type: Type.STRING, description: "Name of the provider" },
      fixedDailyChargeCents: { type: Type.NUMBER, description: "Daily fixed charge in cents" },
      broadbandMonthlyCost: { type: Type.NUMBER, description: "Optional monthly broadband/internet cost in Dollars" },
      joiningCreditDollars: { type: Type.NUMBER, description: "One-off joining credit in dollars (e.g. 300)" },
      discountPct: { type: Type.NUMBER, description: "Percentage discount on the bill (e.g. 3 or 6)" },
      rates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startHour: { type: Type.NUMBER, description: "Start hour (0-23)" },
            endHour: { type: Type.NUMBER, description: "End hour (0-23)" },
            rateCents: { type: Type.NUMBER, description: "Cost in cents per kWh" },
            dayType: { type: Type.STRING, enum: ["WEEKDAY", "WEEKEND", "ALL", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], description: "Use ALL for every day, WEEKDAY/WEEKEND for groups, or MON/TUE/WED/THU/FRI/SAT/SUN for specific days that differ from their group" },
            zoneName: { type: Type.STRING, description: "Name like 'Peak', 'Off-Peak', 'Night', 'Free'" },
            zoneColor: { type: Type.STRING, enum: ["PEAK", "SHOULDER", "OFF_PEAK", "FREE"] }
          },
          required: ["startHour", "endHour", "rateCents", "dayType", "zoneName", "zoneColor"]
        }
      }
    },
    required: ["name", "provider", "fixedDailyChargeCents", "rates"]
  }
};

// Tool 2: Generate Usage Profile
const generateUsageProfileTool: FunctionDeclaration = {
  name: "generateUsageProfile",
  description: "Generates a 24-hour energy usage profile (kWh per hour) based on user description.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hourlyUsage: {
        type: Type.ARRAY,
        items: { type: Type.NUMBER },
        description: "Array of exactly 24 numbers representing kWh usage for each hour (0=midnight to 23=11pm)."
      },
      summary: { type: Type.STRING, description: "A short text summary of the profile created." }
    },
    required: ["hourlyUsage"]
  }
};

export interface ImageAttachment {
  base64Data: string;  // Base64 encoded image data (no data URL prefix)
  mimeType: string;    // e.g., 'image/png', 'image/jpeg'
}

export type AIResponse =
  | { type: 'PLAN'; data: PowerPlan }
  | { type: 'USAGE'; data: UsageProfile; summary?: string }
  | { type: 'ERROR'; message: string };

export const processAIRequest = async (userPrompt: string, image?: ImageAttachment): Promise<AIResponse> => {
    try {
        const model = 'gemini-3-flash-preview';

        const parts: any[] = [];
        if (image) {
          parts.push({
            inlineData: {
              data: image.base64Data,
              mimeType: image.mimeType,
            }
          });
        }
        parts.push({ text: userPrompt });

        const result = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: 'user',
                    parts
                }
            ],
            config: {
                systemInstruction: `
                    You are an expert energy analyst assistant.
                    Your goal is to help the user either:
                    1. Import a power plan from a text description or an image of a plan/rate card.
                    2. Generate a daily usage profile (24 hourly values) based on a description of their habits (e.g., "I use 20kWh a day, mostly at night" or "I have an EV I charge at 2am").

                    If an image is provided, analyze it carefully for power plan details (rates, charges, time periods) and extract the information into the appropriate tool call. Look for rate tables, pricing info, time-of-use periods, and provider names in the image.
                    
                    CRITICAL RULES FOR USAGE PROFILE:
                    - You must output exactly 24 numbers in the 'hourlyUsage' array.
                    - If the user provides a total (e.g., "30 units"), ensure the sum of the array equals that total.
                    - If no total is provided, assume a standard NZ household uses ~20kWh/day.
                    - Model realistic curves (bell curves for morning/evening peaks) unless specified otherwise.

                    CRITICAL RULES FOR POWER PLAN:
                    - Normalize times to 0-23.
                    - Identify "Peak" (Red), "Shoulder" (Orange), "Off-Peak" (Green), "Free" (Blue).
                    - "7am to 9am" means start: 7, end: 8.
                    - ONLY extract information that is explicitly stated. If a field is not mentioned, use 0 for fixedDailyChargeCents. NEVER guess or hallucinate values.
                    - If broadband price is mentioned, include it in broadbandMonthlyCost (Dollars).
                    - If a joining credit is mentioned (e.g., "$300 credit"), put it in joiningCreditDollars.
                    - If a percentage discount is mentioned (e.g., "6% discount"), put it in discountPct.

                    CRITICAL RULES FOR dayType:
                    - Rate lookup priority is: specific day > category > ALL. So you can set a WEEKDAY fallback and override specific days.
                    - Use WEEKDAY/WEEKEND for rates that apply uniformly to all weekdays or weekends.
                    - Use specific days (MON, TUE, WED, THU, FRI, SAT, SUN) ONLY for days that differ from their category.
                    - Example: "Half price 10pm-6am on Tuesdays and Wednesdays" means:
                      * ALL 0-23: Standard rate (base for every day)
                      * TUE 22-23: Half price (override Tue night)
                      * TUE 0-5: Half price (override Tue early morning)
                      * WED 22-23: Half price (override Wed night)
                      * WED 0-5: Half price (override Wed early morning)
                `,
                tools: [{ functionDeclarations: [createPowerPlanTool, generateUsageProfileTool] }],
                toolConfig: {
                    functionCallingConfig: {
                        mode: FunctionCallingConfigMode.ANY
                    }
                }
            }
        });

        const functionCalls = result.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            
            if (call.name === 'createPowerPlan') {
                const planData = call.args as any;
                return {
                    type: 'PLAN',
                    data: {
                        ...planData,
                        id: `imported-${Date.now()}`,
                        description: 'Imported via AI Assistant'
                    }
                };
            }

            if (call.name === 'generateUsageProfile') {
                const usageData = call.args as any;
                if (usageData.hourlyUsage && Array.isArray(usageData.hourlyUsage) && usageData.hourlyUsage.length === 24) {
                    return {
                        type: 'USAGE',
                        data: usageData.hourlyUsage,
                        summary: usageData.summary
                    };
                }
            }
        }

        return { type: 'ERROR', message: "I couldn't understand how to process that. Please try describing a plan or a usage pattern." };

    } catch (error) {
        console.error("AI Processing Error:", error);
        return { type: 'ERROR', message: "AI service unavailable." };
    }
};