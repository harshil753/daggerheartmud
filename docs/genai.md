# Google Gen AI SDK for TypeScript and JavaScript

The Google Gen AI JavaScript SDK enables TypeScript and JavaScript developers to build applications powered by Gemini AI models. It provides a unified interface for accessing both the Gemini Developer API (via API keys from Google AI Studio) and Vertex AI (via Google Cloud authentication). The SDK supports Gemini 2.0 features including text generation, multimodal inputs (text, images, video, audio), streaming responses, function calling, chat sessions, caching, file uploads, embeddings, image/video generation, and real-time live sessions.

The SDK is designed for modern JavaScript environments with Node.js 20+ and supports both server-side and browser-based applications. It offers automatic function calling, context caching to reduce costs on repeated prompts, stateful chat sessions with conversation history management, and comprehensive error handling. The library uses TypeScript for type safety and is distributed as ES modules with support for CommonJS environments.

## Initialize the SDK with API Key

Initialize the GoogleGenAI client using an API key from Google AI Studio for server-side applications.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Verify initialization by listing available models
const models = await ai.models.list();
for await (const model of models) {
  console.log(`Model: ${model.name}`);
}
```

## Initialize the SDK with Vertex AI

Initialize the GoogleGenAI client for Vertex AI using Google Cloud project credentials.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'your-project-id',
  location: 'us-central1',
  apiVersion: 'v1' // Optional: use 'v1' for stable API, defaults to 'beta'
});

// Verify connection and list models
try {
  const modelInfo = await ai.models.get({
    model: 'gemini-2.0-flash'
  });
  console.log(`Model: ${modelInfo.displayName}`);
  console.log(`Description: ${modelInfo.description}`);
} catch (error) {
  console.error('Error connecting to Vertex AI:', error);
}
```

## Generate content from text prompts

Generate text responses from simple text prompts using the generateContent method.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateText() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Explain quantum computing in simple terms',
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    });

    console.log('Generated text:', response.text);
    console.log('Token count:', response.usageMetadata?.totalTokenCount);
    console.log('Finish reason:', response.candidates?.[0]?.finishReason);
  } catch (error) {
    console.error('Generation error:', error);
  }
}

generateText();
```

## Stream content generation in real-time

Stream responses chunk-by-chunk for faster perceived latency using generateContentStream.

```typescript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function streamContent() {
  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-exp',
      contents: 'Write a story about a robot learning to paint',
      config: {
        maxOutputTokens: 1000,
        temperature: 0.9,
        responseModalities: [Modality.TEXT]
      }
    });

    console.log('Streaming response:');
    for await (const chunk of response) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
      }
    }
    console.log('\n\nStream complete');
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

streamContent();
```

## Create multi-turn chat sessions

Create stateful chat sessions that maintain conversation history across multiple turns.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function chatExample() {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024
      },
      history: [] // Optional: provide previous conversation history
    });

    // First turn
    const response1 = await chat.sendMessage({
      message: 'What are the primary colors?'
    });
    console.log('Assistant:', response1.text);

    // Second turn (context is maintained)
    const response2 = await chat.sendMessage({
      message: 'How do I mix them to get purple?'
    });
    console.log('Assistant:', response2.text);

    // Get full conversation history
    const history = chat.getHistory();
    console.log('\nConversation history:');
    for (const content of history) {
      console.log(`${content.role}: ${JSON.stringify(content.parts)}`);
    }
  } catch (error) {
    console.error('Chat error:', error);
  }
}

chatExample();
```

## Stream chat responses

Stream chat responses in real-time for more responsive multi-turn conversations.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function streamingChat() {
  const chat = ai.chats.create({ model: 'gemini-2.0-flash' });

  try {
    // First streaming turn
    console.log('User: Tell me about machine learning');
    const stream1 = await chat.sendMessageStream({
      message: 'Tell me about machine learning'
    });

    process.stdout.write('Assistant: ');
    for await (const chunk of stream1) {
      process.stdout.write(chunk.text || '');
    }
    console.log('\n');

    // Second streaming turn
    console.log('User: What are neural networks?');
    const stream2 = await chat.sendMessageStream({
      message: 'What are neural networks?'
    });

    process.stdout.write('Assistant: ');
    for await (const chunk of stream2) {
      process.stdout.write(chunk.text || '');
    }
    console.log('\n');

    console.log('\nTotal turns:', chat.getHistory().length);
  } catch (error) {
    console.error('Streaming chat error:', error);
  }
}

streamingChat();
```

## Function calling with tool declarations

Enable the model to call external functions by declaring function schemas and handling the calls.

```typescript
import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function functionCallingExample() {
  // Define function schema
  const controlLightDeclaration: FunctionDeclaration = {
    name: 'controlLight',
    description: 'Control smart home lighting',
    parameters: {
      type: Type.OBJECT,
      properties: {
        brightness: {
          type: Type.NUMBER,
          description: 'Light level from 0 to 100'
        },
        colorTemperature: {
          type: Type.STRING,
          description: 'Color temperature: daylight, cool, or warm'
        }
      },
      required: ['brightness', 'colorTemperature']
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Make the room cozy for reading',
      config: {
        tools: [{ functionDeclarations: [controlLightDeclaration] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['controlLight']
          }
        }
      }
    });

    // Handle function calls
    if (response.functionCalls) {
      for (const call of response.functionCalls) {
        console.log(`Function: ${call.name}`);
        console.log(`Arguments:`, JSON.stringify(call.args, null, 2));

        // Execute your actual function here
        const result = executeControlLight(call.args);
        console.log(`Result:`, result);
      }
    }
  } catch (error) {
    console.error('Function calling error:', error);
  }
}

function executeControlLight(args: any) {
  // Your actual implementation
  return { success: true, brightness: args.brightness, colorTemp: args.colorTemperature };
}

functionCallingExample();
```

## Cache content for repeated use

Create cached content to reduce costs when using the same large prompt prefix multiple times.

```typescript
import { GoogleGenAI, Part } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION
});

async function cachingExample() {
  try {
    // Create cache with large documents
    const cachedContent1: Part = {
      fileData: {
        fileUri: 'gs://cloud-samples-data/generative-ai/pdf/2403.05530.pdf',
        mimeType: 'application/pdf'
      }
    };

    const cachedContent2: Part = {
      fileData: {
        fileUri: 'gs://cloud-samples-data/generative-ai/pdf/2312.11805v3.pdf',
        mimeType: 'application/pdf'
      }
    };

    const cache = await ai.caches.create({
      model: 'gemini-1.5-pro-002',
      config: {
        contents: [cachedContent1, cachedContent2],
        ttl: '3600s' // Cache for 1 hour
      }
    });

    console.log('Cache created:', cache.name);

    // List all caches
    const caches = await ai.caches.list();
    for await (const cachedItem of caches) {
      console.log('Cached content:', cachedItem.name);
    }

    // Update cache TTL
    const updated = await ai.caches.update({
      name: cache.name!,
      config: { ttl: '7200s' } // Extend to 2 hours
    });
    console.log('Cache updated, new expiry:', updated.expireTime);

    // Delete cache when done
    await ai.caches.delete({ name: cache.name! });
    console.log('Cache deleted');
  } catch (error) {
    console.error('Caching error:', error);
  }
}

cachingExample();
```

## Upload and process files

Upload files to the API and reference them in generation requests for content analysis.

```typescript
import { GoogleGenAI, ContentListUnion, createPartFromUri } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fileUploadExample() {
  try {
    // Create file to upload
    const testFile = new Blob(
      ['The quick brown fox jumps over the lazy dog. This is a test document about animals.'],
      { type: 'text/plain' }
    );

    // Upload file
    const file = await ai.files.upload({
      file: testFile,
      config: {
        displayName: 'test-document.txt',
        mimeType: 'text/plain'
      }
    });

    console.log('File uploaded:', file.name);

    // Wait for processing
    let getFile = await ai.files.get({ name: file.name! });
    while (getFile.state === 'PROCESSING') {
      console.log('File processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      getFile = await ai.files.get({ name: file.name! });
    }

    if (getFile.state === 'FAILED') {
      throw new Error('File processing failed');
    }

    console.log('File ready:', getFile.state);

    // Use file in generation request
    const content: ContentListUnion = [
      'Summarize this document in one sentence.'
    ];

    if (file.uri && file.mimeType) {
      content.push(createPartFromUri(file.uri, file.mimeType));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: content
    });

    console.log('Summary:', response.text);

    // Clean up
    await ai.files.delete({ name: file.name! });
    console.log('File deleted');
  } catch (error) {
    console.error('File upload error:', error);
  }
}

fileUploadExample();
```

## Generate images with Imagen

Generate images from text prompts using the Imagen model.

```typescript
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImageExample() {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'A serene mountain landscape at sunset with purple sky',
      config: {
        numberOfImages: 2,
        aspectRatio: '16:9',
        includeRaiReason: true, // Include safety filter reasons
        personGeneration: 'allow_adult' // Control person generation
      }
    });

    if (response.generatedImages) {
      response.generatedImages.forEach((img, i) => {
        if (img.image?.imageBytes) {
          const buffer = Buffer.from(img.image.imageBytes, 'base64');
          fs.writeFileSync(`generated_image_${i}.png`, buffer);
          console.log(`Saved image ${i}: generated_image_${i}.png`);
        }
        if (img.raiFilteredReason) {
          console.log(`Image ${i} filtered:`, img.raiFilteredReason);
        }
      });
    }
  } catch (error) {
    console.error('Image generation error:', error);
  }
}

generateImageExample();
```

## Generate videos with Veo

Generate videos from text prompts using the Veo model with long-running operations.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateVideoExample() {
  try {
    // Start video generation operation
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: 'A golden retriever playing with a ball in a sunny park',
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        duration: 5 // seconds
      }
    });

    console.log('Operation started:', operation.name);

    // Poll operation status
    while (!operation.done) {
      console.log('Waiting for video generation...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.get({ operation: operation });

      if (operation.metadata?.progress) {
        console.log(`Progress: ${operation.metadata.progress}%`);
      }
    }

    // Download generated videos
    const videos = operation.response?.generatedVideos;
    if (!videos || videos.length === 0) {
      throw new Error('No videos generated');
    }

    for (const [i, video] of videos.entries()) {
      await ai.files.download({
        file: video,
        downloadPath: `generated_video_${i}.mp4`
      });
      console.log(`Downloaded: generated_video_${i}.mp4`);
    }
  } catch (error) {
    console.error('Video generation error:', error);
  }
}

generateVideoExample();
```

## Create embeddings for text

Generate vector embeddings for text content using embedding models.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function embeddingExample() {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'Machine learning is a subset of artificial intelligence',
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768 // Optional: reduce dimensions
      }
    });

    console.log('Embedding dimension:', response.embedding?.values?.length);
    console.log('First 5 values:', response.embedding?.values?.slice(0, 5));

    // Example: compute similarity between two embeddings
    const response2 = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: 'AI includes machine learning techniques',
      config: { taskType: 'RETRIEVAL_QUERY' }
    });

    const similarity = cosineSimilarity(
      response.embedding?.values || [],
      response2.embedding?.values || []
    );
    console.log('Similarity score:', similarity);
  } catch (error) {
    console.error('Embedding error:', error);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}

embeddingExample();
```

## Count tokens in content

Count tokens to estimate costs and ensure content fits within model limits.

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function countTokensExample() {
  try {
    const longText = `
      Artificial intelligence has transformed many industries.
      Machine learning algorithms can now process vast amounts of data.
      Deep learning models achieve remarkable accuracy in various tasks.
    `.repeat(100); // Simulate long content

    const response = await ai.models.countTokens({
      model: 'gemini-2.0-flash',
      contents: longText,
      config: {
        systemInstruction: 'You are a helpful assistant',
        tools: [{
          functionDeclarations: [
            { name: 'search', parameters: { type: 'object' } }
          ]
        }]
      }
    });

    console.log('Total tokens:', response.totalTokens);
    console.log('Prompt tokens:', response.promptTokens);

    const maxTokens = 1000000; // Model limit
    if (response.totalTokens! > maxTokens) {
      console.warn(`Content exceeds limit by ${response.totalTokens! - maxTokens} tokens`);
    }
  } catch (error) {
    console.error('Token counting error:', error);
  }
}

countTokensExample();
```

## Connect to Live API for real-time streaming

Create real-time bidirectional streaming sessions for interactive AI experiences with text, audio, and video.

```typescript
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class AsyncQueue<T> {
  private queue: T[] = [];
  private waiting: ((value: T) => void)[] = [];

  put(item: T): void {
    if (this.waiting.length > 0) {
      this.waiting.shift()!(item);
    } else {
      this.queue.push(item);
    }
  }

  get(): Promise<T> {
    return new Promise<T>((resolve) => {
      if (this.queue.length > 0) {
        resolve(this.queue.shift()!);
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  clear(): void {
    this.queue = [];
    this.waiting = [];
  }
}

async function liveSessionExample() {
  const responseQueue = new AsyncQueue<LiveServerMessage>();

  try {
    const session = await ai.live.connect({
      model: 'gemini-2.0-flash-live-preview-04-09',
      callbacks: {
        onopen: () => console.log('Live session opened'),
        onmessage: (message) => responseQueue.put(message),
        onerror: (e) => console.error('Session error:', e.message),
        onclose: (e) => {
          console.log('Session closed:', e.reason);
          responseQueue.clear();
        }
      },
      config: {
        responseModalities: [Modality.TEXT, Modality.AUDIO]
      }
    });

    // Send text message
    session.sendClientContent({
      turns: 'Tell me a short joke about programming'
    });

    // Process response
    while (true) {
      const message = await responseQueue.get();
      const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
      const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData;

      if (text) console.log('Received text:', text);
      if (audioData) console.log('Received audio data');

      if (message.serverContent?.turnComplete) {
        break;
      }
    }

    // Send multimodal content
    session.sendClientContent({
      turns: [
        'Describe this image:',
        {
          inlineData: {
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAC0lEQVR4nGNgQAYAAA4AAamRc7EAAAAASUVORK5CYII=',
            mimeType: 'image/png'
          }
        }
      ]
    });

    // Process second response
    while (true) {
      const message = await responseQueue.get();
      if (message.serverContent?.turnComplete) break;
    }

    session.close();
  } catch (error) {
    console.error('Live session error:', error);
  }
}

liveSessionExample();
```

## Handle errors with ApiError

Catch and handle API errors using the structured ApiError class with status codes and messages.

```typescript
import { GoogleGenAI, ApiError } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function errorHandlingExample() {
  try {
    const response = await ai.models.generateContent({
      model: 'non-existent-model', // Invalid model
      contents: 'Hello world'
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error Name:', error.name);
      console.error('Status Code:', error.status);
      console.error('Message:', error.message);
      console.error('Details:', error.details);

      // Handle specific errors
      switch (error.status) {
        case 404:
          console.log('Model not found. Check model name.');
          break;
        case 429:
          console.log('Rate limit exceeded. Retry with backoff.');
          break;
        case 401:
          console.log('Authentication failed. Check API key.');
          break;
        case 400:
          console.log('Invalid request parameters.');
          break;
        default:
          console.log('Unexpected error occurred.');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }

  // Example with retry logic
  async function generateWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: 'Hello'
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  await generateWithRetry();
}

errorHandlingExample();
```

## Summary and Integration

The Google Gen AI SDK provides comprehensive access to Gemini models for building AI-powered applications in TypeScript and JavaScript. Key use cases include conversational chatbots with multi-turn dialogue, content generation systems for creating text/images/videos, semantic search using embeddings, RAG (Retrieval-Augmented Generation) systems with context caching, multimodal applications processing text/images/audio/video, intelligent agents with function calling for external tool integration, real-time interactive experiences using live streaming sessions, and document analysis workflows with file uploads. The SDK handles authentication for both API key and Google Cloud credentials, manages streaming responses efficiently, and provides automatic retry logic with exponential backoff.

Integration patterns include server-side Node.js applications for production workloads with secure API key management, browser-based clients for interactive demos (with security considerations), serverless functions (AWS Lambda, Cloud Functions, Vercel) for scalable API endpoints, chatbot frameworks integrating the chat API with UI components, data pipelines using embeddings for semantic analysis, and webhook handlers processing long-running operations like video generation. The SDK's TypeScript support ensures type safety across all API interactions, while the unified interface for both Gemini Developer API and Vertex AI simplifies migrations between development and production environments. Built-in features like automatic function calling, context caching, and comprehensive error handling reduce boilerplate code and accelerate development of sophisticated AI applications.
