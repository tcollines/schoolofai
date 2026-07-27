import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client
// Note: We use the Vite environment variable VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Only initialize if the key exists to avoid crashing if it's missing
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates a thumbnail image for a course using Gemini's Imagen 3.
 * Returns the image as a base64 Data URL or null if generation fails.
 */
export async function generateCourseThumbnail(title: string, description: string): Promise<string | null> {
    if (!ai) {
        console.warn('Gemini API key is missing. Cannot generate image.');
        return null;
    }

    try {
        const prompt = `A professional, high-quality, abstract and modern thumbnail image for an educational course titled '${title}'. Context: ${description}. No text, no words.`;

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '16:9'
            }
        });

        const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
        
        if (base64Image) {
            return `data:image/png;base64,${base64Image}`;
        }
        
        return null;
    } catch (error) {
        console.error('Error generating course thumbnail:', error);
        throw error;
    }
}
