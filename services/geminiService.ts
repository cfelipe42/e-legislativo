
import { GoogleGenAI, Type } from "@google/genai";

/* Always use the environment variable directly for the API key as per guidelines */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeBill = async (billTitle: string, billText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o seguinte projeto de lei e forneça um resumo executivo com:
      1. Objetivo Principal
      2. Principais Impactos Orçamentários
      3. Pontos de Atenção (Possíveis controvérsias)
      
      Título: ${billTitle}
      Texto: ${billText}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    /* Accessing the .text property directly as per guidelines */
    return response.text;
  } catch (error) {
    console.error("Error summarizing bill:", error);
    return "Não foi possível gerar o resumo automático no momento.";
  }
};

export const checkLegalCompliance = async (billText: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Atue como um consultor jurídico legislativo. Verifique se o seguinte texto de projeto de lei possui inconsistências constitucionais aparentes ou conflitos com leis federais brasileiras:
      
      Texto: ${billText}`,
    });

    /* Accessing the .text property directly as per guidelines */
    return response.text;
  } catch (error) {
    console.error("Error checking compliance:", error);
    return "Análise jurídica indisponível.";
  }
};
