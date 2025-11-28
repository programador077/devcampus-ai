import { GoogleGenAI, Type, FunctionDeclaration, Modality, LiveServerMessage } from "@google/genai";

// Ensure API Key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing via process.env.API_KEY");
}

export const getAIClient = (forceNewKey: boolean = false) => {
    // If we need a fresh client (e.g. for Veo/Imagen paid keys), we re-instantiate
    // In a real browser env with injected env vars, we use process.env.API_KEY
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- CHAT & TEXT ---

export const streamChat = async (
  model: string,
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  tools: 'none' | 'search' | 'maps' = 'none',
  thinkingBudget: number = 0,
  location?: { lat: number; lng: number }
) => {
  const ai = getAIClient();
  
  const config: any = {
    systemInstruction: "Eres un tutor experto de programación en DevCampus. Responde en español.",
  };

  if (thinkingBudget > 0) {
    config.thinkingConfig = { thinkingBudget };
    // Do not set maxOutputTokens when thinking is enabled per guidelines
  }

  if (tools === 'search') {
    config.tools = [{ googleSearch: {} }];
  } else if (tools === 'maps') {
    config.tools = [{ googleMaps: {} }];
    if (location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      };
    }
  }

  const chat = ai.chats.create({
    model,
    config,
    history: history as any,
  });

  return chat.sendMessageStream({ message });
};

// --- IMAGES ---

export const generateImage = async (prompt: string, aspectRatio: string, size: string) => {
  // Check for paid key for Pro Image
  if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
     // Proceed
  } else if (window.aistudio) {
      await window.aistudio.openSelectKey();
  }

  const ai = getAIClient(true);
  return ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size as any,
      }
    }
  });
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = getAIClient();
  return ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Nano banana
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
  });
};

// --- VIDEO (VEO) ---

export const generateVideo = async (prompt: string, config: any, imageBase64?: string, imageMime?: string) => {
  // Veo requires paid key selection
  if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
  }
  
  const ai = getAIClient(true);
  
  const reqConfig = {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio
  };

  let operation;
  
  if (imageBase64 && imageMime) {
      // Image-to-Video
      operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt || "Anima esta imagen",
          image: {
            imageBytes: imageBase64,
            mimeType: imageMime
          },
          config: reqConfig
      });
  } else {
      // Text-to-Video
      operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: reqConfig
      });
  }

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (operation.response?.generatedVideos?.[0]?.video?.uri) {
      const uri = operation.response.generatedVideos[0].video.uri;
      return `${uri}&key=${process.env.API_KEY}`;
  }
  throw new Error("La generación de video falló o no devolvió URI");
};

// --- ANALYSIS ---

export const analyzeContent = async (
    model: string, 
    prompt: string, 
    parts: { inlineData: { data: string; mimeType: string } }[]
) => {
    const ai = getAIClient();
    return ai.models.generateContent({
        model,
        contents: {
            parts: [
                ...parts,
                { text: `${prompt}. Responde en español.` }
            ]
        }
    });
};

export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    const ai = getAIClient();
    return ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Audio,
                        mimeType: mimeType
                    }
                },
                { text: "Transcribe este audio exactamente." }
            ]
        }
    });
};


// --- TTS ---

export const generateSpeech = async (text: string) => {
    const ai = getAIClient();
    return ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
};

// --- LIVE API UTILS ---

export const connectLiveSession = async (
    onOpen: () => void,
    onMessage: (msg: LiveServerMessage) => void,
    onClose: (e: CloseEvent) => void,
    onError: (e: ErrorEvent) => void
) => {
    const ai = getAIClient();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: onOpen,
            onmessage: onMessage,
            onclose: onClose,
            onerror: onError
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            },
            systemInstruction: "Eres un instructor de programación amigable realizando una entrevista de práctica. Haz preguntas técnicas. Habla en español."
        }
    });
}