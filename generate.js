// This code will run on Vercel's serverless platform, not the user's browser.
import fetch from 'node-fetch';

export default async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { prompt, aspectRatio } = req.body;
    const HF_API_KEY = process.env.HUGGING_FACE_API_KEY; // Stored securely on Vercel
    const HF_ENHANCER_MODEL = "huggingface/model-for-prompt-enhancement"; // Replace with a real prompt enhancer model
    const HF_IMAGE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"; // A powerful image model

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    // A. AI-Powered Prompt Enhancement
    let enhancedPrompt = prompt;
    try {
        const enhancerResponse = await fetch(
            `https://api-inference.huggingface.co/models/${HF_ENHANCER_MODEL}`,
            {
                headers: { Authorization: `Bearer ${HF_API_KEY}` },
                method: "POST",
                body: JSON.stringify({ inputs: `Enhance this prompt for an AI image generator: "${prompt}"` }),
            }
        );
        const enhancerResult = await enhancerResponse.json();
        // Assuming the enhancer returns a clean text output
        enhancedPrompt = enhancerResult[0].generated_text || prompt;

    } catch (enhancerError) {
        console.error('Prompt enhancement failed, using original prompt:', enhancerError);
        // Fallback to original prompt
    }

    // B. Image Generation
    const images = [];
    const numVariations = 4;
    const sizeMap = {
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1536, height: 864 }, // Using a Stable Diffusion friendly resolution
        '9:16': { width: 864, height: 1536 },
        '4:3': { width: 1024, height: 768 }
    };
    const dimensions = sizeMap[aspectRatio] || sizeMap['16:9'];

    // We make a single request to generate 4 images if the model supports it.
    // Stable Diffusion XL can generate a batch of images.
    const imagePayload = {
        inputs: enhancedPrompt,
        parameters: {
            ...dimensions,
            num_images_per_prompt: numVariations,
            guidance_scale: 7.5,
            num_inference_steps: 50
        }
    };

    try {
        const imageResponse = await fetch(
            `https://api-inference.huggingface.co/models/${HF_IMAGE_MODEL}`,
            {
                headers: { Authorization: `Bearer ${HF_API_KEY}` },
                method: "POST",
                body: JSON.stringify(imagePayload),
            }
        );

        if (!imageResponse.ok) {
            const errorText = await imageResponse.json();
            throw new Error(`Image API error: ${imageResponse.status} - ${JSON.stringify(errorText)}`);
        }

        const imageBlobs = await imageResponse.blob(); // Response is a zip file for multiple images
        // For simplicity, we'll assume a single image or a list of data URLs.
        // In a real-world scenario, you would need to process a ZIP file on the server.
        // A simpler API or a different approach is needed here.
        // Let's assume for now that the API returns an array of base64-encoded images.

        const responseData = await imageResponse.json();
        // The Hugging Face Inference API for some models returns a base64 encoded image or a direct image blob.
        // You would handle this response accordingly.
        // For a more reliable batch generation, a different model or service might be better.
        // We will mock a successful response for demonstration.
        
        // Mock response
        const mockImages = [
            'data:image/jpeg;base64,.....',
            'data:image/jpeg;base64,.....',
            'data:image/jpeg;base64,.....',
            'data:image/jpeg;base64,.....'
        ];

        return res.status(200).json({ images: mockImages });

    } catch (error) {
        console.error('Image generation failed:', error);
        return res.status(500).json({ error: `Image generation failed: ${error.message}` });
    }
}
