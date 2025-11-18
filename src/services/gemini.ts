// src/services/gemini.ts
export const fetchGeminiData = async () => {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch('https://api.gemini.com/v1/some-endpoint', {
    headers: { 'Authorization': `Bearer ${geminiKey}` }
  });

  return response.json();
};
