// src/components/GeminiData.tsx
import React, { useEffect, useState } from 'react';
import { fetchGeminiData } from '../services/gemini';

const GeminiData = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchGeminiData();
        setData(result);
      } catch (err) {
        console.error('Error fetching Gemini data:', err);
      }
    };

    getData();
  }, []);

  return (
    <div>
      <h2>Gemini API Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default GeminiData;
