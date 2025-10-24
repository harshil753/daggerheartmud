### Quickstart Example

Source: https://googleapis.github.io/js-genai/index

A simple example demonstrating how to use the SDK with an API key from Google AI Studio.

```APIDOC
## Quickstart

The simplest way to get started is to use an API key from Google AI Studio:

```javascript
import {GoogleGenAI} from '@google/genai';  
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  
  
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});  
  
async function main() {  
  const response = await ai.models.generateContent({  
    model: 'gemini-2.0-flash-001',  
    contents: 'Why is the sky blue?',  
  });  
  console.log(response.text);  
}  
  
main();
```
```

--------------------------------

### Quickstart: Generate Content with API Key

Source: https://googleapis.github.io/js-genai/release_docs/index

A simple example demonstrating how to initialize the GoogleGenAI SDK with an API key and generate content using the Gemini API. It logs the text response to the console.

```javascript
import {GoogleGenAI} from '@google/genai';  
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  
  
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});  
  
async function main() {  
  const response = await ai.models.generateContent({  
    model: 'gemini-2.0-flash-001',  
    contents: 'Why is the sky blue?',  
  });  
  console.log(response.text);  
}  
  
main();
```

--------------------------------

### Quickstart: Generate Content with API Key

Source: https://googleapis.github.io/js-genai/index

This JavaScript code snippet demonstrates a basic 'Hello World' example using the Google Gen AI SDK with an API key. It initializes the SDK, specifies a model, sends a prompt, and logs the text response. It requires the GEMINI_API_KEY environment variable.

```javascript
import {GoogleGenAI} from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: 'Why is the sky blue?',
  });
  console.log(response.text);
}

main();
```

--------------------------------

### Installation

Source: https://googleapis.github.io/js-genai/index

Install the Google Gen AI SDK using npm.

```APIDOC
## Installation

To install the SDK, run the following command:

```bash
npm install @google/genai
```
```

--------------------------------

### Install @google/genai SDK

Source: https://googleapis.github.io/js-genai/index

This command installs the Google Gen AI SDK using npm. Ensure you have Node.js version 20 or later installed.

```bash
npm install @google/genai
```

--------------------------------

### Initialize Google GenAI SDK for Gemini API

Source: https://googleapis.github.io/js-genai/release_docs/classes/client

Initializes the Google GenAI SDK for use with the Gemini API. Requires an API key. This setup is suitable for direct access to Gemini models.

```typescript
import {GoogleGenAI} from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```

--------------------------------

### Initialize Google GenAI SDK for Vertex AI API

Source: https://googleapis.github.io/js-genai/release_docs/classes/client

Initializes the Google GenAI SDK for use with the Vertex AI API. Requires project ID and location, along with a flag indicating Vertex AI usage. This setup is for leveraging Vertex AI services.

```typescript
import {GoogleGenAI} from '@google/genai';  
const ai = new GoogleGenAI({
  vertexai: true,  
  project: 'PROJECT_ID',  
  location: 'PROJECT_LOCATION'
});
```

--------------------------------

### Configure Vertex AI with Environment Variables (NodeJS)

Source: https://googleapis.github.io/js-genai/index

This example demonstrates setting environment variables for Vertex AI integration with the Google Gen AI SDK in NodeJS. It includes enabling Vertex AI, specifying the project ID, and the cloud location. After setting these, you can initialize the client without explicit parameters.

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT='your-project-id'
export GOOGLE_CLOUD_LOCATION='us-central1'
```

--------------------------------

### Configure Gemini API with Environment Variables (NodeJS)

Source: https://googleapis.github.io/js-genai/index

This example shows how to set the GOOGLE_API_KEY environment variable for the Gemini Developer API in a NodeJS environment. This approach helps in managing secrets and is recommended over hardcoding keys.

```bash
export GOOGLE_API_KEY='your-api-key'
```

--------------------------------

### get

Source: https://googleapis.github.io/js-genai/release_docs/classes/models

Fetches information about a model by name.

```APIDOC
## GET /models/{model}

### Description
Fetches information about a model by name.

### Method
GET

### Endpoint
/models/{model}

### Parameters
#### Path Parameters
- **model** (string) - Required - The name of the model to fetch.

### Response
#### Success Response (200)
- **Model** - Information about the model.
  - **name** (string) - The name of the model.
  - **version** (string) - The version of the model.
  - **displayName** (string) - The display name of the model.
  - **description** (string) - A description of the model.
  - **inputSchema** (object) - The schema for the model's input.
  - **outputSchema** (object) - The schema for the model's output.

#### Response Example
```json
{
  "name": "gemini-2.0-flash",
  "version": "1.0",
  "displayName": "Gemini Flash",
  "description": "A fast and efficient Gemini model.",
  "inputSchema": {},
  "outputSchema": {}
}
```
```

--------------------------------

### GET /caches/list

Source: https://googleapis.github.io/js-genai/release_docs/classes/caches

Lists cached content configurations. Supports pagination with pageSize parameter.

```APIDOC
## GET /caches/list

### Description
Lists all cached content configurations. Allows filtering and pagination.

### Method
GET

### Endpoint
/caches/list

### Parameters
#### Query Parameters
- **params** (ListCachedContentsParameters) - Optional - The parameters for the list request.
  - **config** (object) - Optional - Filtering parameters.
    - **pageSize** (number) - Optional - The maximum number of items to return per page.

### Request Example
```json
{
  "config": {
    "pageSize": 2
  }
}
```

### Response
#### Success Response (200)
- **pager** (Pager<CachedContent>) - An iterable object containing paginated cached content.

#### Response Example
```json
{
  "pager": [
    {
      "name": "...",
      "createTime": "...",
      "updateTime": "...",
      "displayName": "test cache",
      "model": "gemini-2.0-flash-001"
    },
    {
      "name": "...",
      "createTime": "...",
      "updateTime": "...",
      "displayName": "another cache",
      "model": "gemini-2.0-flash-001"
    }
  ]
}
```
```

--------------------------------

### Get Cached Content with @google/genai

Source: https://googleapis.github.io/js-genai/release_docs/classes/caches

Illustrates how to retrieve cached content configurations using the `get` method of the Caches class. The method requires the server-generated resource name of the cached content to fetch.

```javascript
await ai.caches.get({name: '...'}); // The server-generated resource name.
```

--------------------------------

### Files API - Get Method

Source: https://googleapis.github.io/js-genai/release_docs/classes/files

Retrieves information about a specific file from the service. This endpoint returns details about the file, such as its name and metadata.

```APIDOC
## GET /v1/files/{name}

### Description
Retrieves the file information from the service.

### Method
GET

### Endpoint
/v1/files/{name}

### Parameters
#### Path Parameters
- **name** (string) - Required - The name of the file to retrieve (e.g., "files/mehozpxf877d").

### Request Example
```json
{
  "name": "files/mehozpxf877d"
}
```

### Response
#### Success Response (200)
- **name** (string) - The name of the file.
- **displayName** (string) - The display name of the file.
- **mimeType** (string) - The MIME type of the file.
- **createTime** (string) - The timestamp when the file was created.
- **updateTime** (string) - The timestamp when the file was last updated.
- **sizeBytes** (integer) - The size of the file in bytes.

#### Response Example
```json
{
  "name": "files/mehozpxf877d",
  "displayName": "example.txt",
  "mimeType": "text/plain",
  "createTime": "2023-10-27T10:00:00Z",
  "updateTime": "2023-10-27T10:00:00Z",
  "sizeBytes": 1024
}
```
```

--------------------------------

### Get Batch Job Configuration with @google/genai

Source: https://googleapis.github.io/js-genai/release_docs/classes/batches

Retrieves the configuration of a specific batch job using the 'get' method of the Batches class. This method requires the resource name of the batch job. It returns a Promise that resolves with the BatchJob object containing the job's configurations.

```javascript
await ai.batches.get({name: '...'}); // The server-generated resource name.
```

--------------------------------

### Operations API - get

Source: https://googleapis.github.io/js-genai/release_docs/classes/operations

Retrieves the status of a long-running operation.

```APIDOC
## get

### Description
Gets the status of a long-running operation.

### Method
GET

### Endpoint
`/operations/{operationId}` (Example, actual endpoint may vary)

### Parameters
#### Path Parameters
None explicitly shown, but implied by `OperationGetParameters`

#### Query Parameters
None explicitly shown, but implied by `OperationGetParameters`

#### Request Body
- **parameters** (OperationGetParameters<T, U>) - Required - The parameters for the get operation request.
  - **operationId** (string) - Required - The ID of the operation to retrieve.

### Request Example
```json
{
  "parameters": {
    "operationId": "operation-123"
  }
}
```

### Response
#### Success Response (200)
- **Operation<T>** (Operation) - The updated Operation object, with the latest status or result.

#### Response Example
```json
{
  "done": false,
  "metadata": {},
  "response": null
}
```
```

--------------------------------

### GET /caches/get

Source: https://googleapis.github.io/js-genai/release_docs/classes/caches

Retrieves cached content configurations. Requires the resource name of the content to retrieve.

```APIDOC
## GET /caches/get

### Description
Retrieves the configuration of a specific cached content resource.

### Method
GET

### Endpoint
/caches/get

### Parameters
#### Request Body
- **params** (GetCachedContentParameters) - Required - The parameters for the get request.
  - **name** (string) - Required - The server-generated resource name of the cached content to retrieve.

### Request Example
```json
{
  "name": "..."
}
```

### Response
#### Success Response (200)
- **cachedContent** (CachedContent) - The cached content details.

#### Response Example
```json
{
  "cachedContent": {
    "name": "...",
    "createTime": "...",
    "updateTime": "...",
    "displayName": "test cache",
    "model": "gemini-2.0-flash-001"
  }
}
```
```

--------------------------------

### Define VideoMetadata Interface

Source: https://googleapis.github.io/js-genai/release_docs/interfaces/types

Defines the VideoMetadata interface used to describe video properties for AI model processing. It includes optional fields for end offset, frames per second, and start offset.

```typescript
interface VideoMetadata {
  endOffset?: string;
  fps?: number;
  startOffset?: string;
}
```

--------------------------------

### Get Model Information using JavaScript

Source: https://googleapis.github.io/js-genai/release_docs/classes/models

Fetches information about a specific model by its name. This function is useful for retrieving metadata and capabilities of available AI models. It requires the model identifier as a parameter and returns a Model object containing details about the model.

```javascript
const modelInfo = await ai.models.get({model: 'gemini-2.0-flash'});
```

--------------------------------

### Get Tuning Job Details with Google AI JS SDK

Source: https://googleapis.github.io/js-genai/release_docs/classes/tunings

Retrieves details of a specific TuningJob using the Google AI JavaScript SDK. This method takes GetTuningJobParameters, including the job name, and returns a Promise resolving to a TuningJob object. Note that the SDK's tuning implementation is experimental and may be subject to change.

```typescript
const tuningJob = await ai.tunings.get({name: 'your-tuning-job-name'});
```

--------------------------------

### Session Class - Constructor

Source: https://googleapis.github.io/js-genai/release_docs/classes/live

Initializes a new Session instance, establishing a connection to the API.

```APIDOC
## constructor Session

### Description
Initializes a new Session instance, establishing a connection to the API.

### Method
constructor

### Endpoint
N/A

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
```javascript
// Example instantiation (actual usage might vary based on context)
const session = new Session(websocketConnection, apiClientInstance);
```

### Response
#### Success Response (200)
N/A (Constructor does not return a value in the typical sense)

#### Response Example
N/A
```

--------------------------------

### GoogleGenAI Initialization

Source: https://googleapis.github.io/js-genai/release_docs/classes/client

This section details how to initialize the GoogleGenAI SDK for either the Gemini API or the Vertex AI API.

```APIDOC
## GoogleGenAI Class

The Google GenAI SDK.

### Remarks
Provides access to the GenAI features through either the Gemini API or the Vertex AI API.
The GoogleGenAIOptions.vertexai value determines which of the API services to use.
When using the Gemini API, a GoogleGenAIOptions.apiKey must also be set, when using Vertex AI GoogleGenAIOptions.project and GoogleGenAIOptions.location must also be set.

### Initialization for Gemini API

#### Example
```javascript
import {GoogleGenAI} from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```

### Initialization for Vertex AI API

#### Example
```javascript
import {GoogleGenAI} from '@google/genai';  
const ai = new GoogleGenAI({
  vertexai: true,  
  project: 'PROJECT_ID',
  location: 'PROJECT_LOCATION'
});
```

### Constructor

#### `new GoogleGenAI(options: GoogleGenAIOptions)`

Initializes a new instance of the GoogleGenAI class.

##### Parameters
- **options** (GoogleGenAIOptions) - Required - Configuration options for the SDK.

##### Returns
- GoogleGenAI - An instance of the GoogleGenAI class.
```

--------------------------------

### LiveMusicSession Constructor

Source: https://googleapis.github.io/js-genai/release_docs/classes/music

Initializes a new LiveMusicSession instance, establishing a connection to the API.

```APIDOC
## constructor LiveMusicSession

### Description
Initializes a new LiveMusicSession instance.

### Method
`constructor`

### Parameters
#### Path Parameters
- **conn** (WebSocket) - Required - The WebSocket connection object.
- **apiClient** (ApiClient) - Required - The API client instance.

### Returns
- **LiveMusicSession** - The newly created LiveMusicSession instance.
```

--------------------------------

### GoogleGenAI Overview

Source: https://googleapis.github.io/js-genai/index

Overview of the main modules available through the GoogleGenAI instance for interacting with the Gemini API.

```APIDOC
## GoogleGenAI overview

All API features are accessed through an instance of the `GoogleGenAI` classes. The submodules bundle together related API methods:

* `ai.models`: Use `models` to query models (`generateContent`, `generateImages`, ...), or examine their metadata.
* `ai.caches`: Create and manage `caches` to reduce costs when repeatedly using the same large prompt prefix.
* `ai.chats`: Create local stateful `chat` objects to simplify multi turn interactions.
* `ai.files`: Upload `files` to the API and reference them in your prompts. This reduces bandwidth if you use a file many times, and handles files too large to fit inline with your prompt.
* `ai.live`: Start a `live` session for real time interaction, allows text + audio + video input, and text or audio output.
```

--------------------------------

### Initialization - Vertex AI

Source: https://googleapis.github.io/js-genai/index

Initialize the GoogleGenAI client for Vertex AI, requiring project and location details.

```APIDOC
### Vertex AI

Sample code for VertexAI initialization:

```javascript
import { GoogleGenAI } from '@google/genai';  
  
const ai = new GoogleGenAI({
    vertexai: true,  
    project: 'your_project',  
    location: 'your_location',
});
```
```

--------------------------------

### Integrate MCP Server with Gemini JavaScript SDK (Experimental)

Source: https://googleapis.github.io/js-genai/index

Demonstrates the experimental support for Model Context Protocol (MCP) servers. This sample shows how to pass a local MCP server as a tool to `generateContent`. It requires `@google/genai`, `@modelcontextprotocol/sdk/client/index.js`, and `@modelcontextprotocol/sdk/client/stdio.js`. An MCP server executable (e.g., weather-mcp) should be available.

```javascript
import { GoogleGenAI, FunctionCallingConfigMode , mcpToTool} from '@google/genai';  
import { Client } from "@modelcontextprotocol/sdk/client/index.js";  
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";  
  
// Create server parameters for stdio connection  
const serverParams = new StdioClientTransport({
  command: "npx", // Executable  
  args: ["-y", "@philschmid/weather-mcp"] // MCP Server  
});  
  
const client = new Client(
  {
    name: "example-client",
    version: "1.0.0"
  }
);
  
// Configure the client  
const ai = new GoogleGenAI({});
  
// Initialize the connection between client and server  
await client.connect(serverParams);
  
// Send request to the model with MCP tools  
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `What is the weather in London in ${new Date().toLocaleDateString()}?`,
  config: {
    tools: [mcpToTool(client)],  // uses the session, will automatically call the tool using automatic function calling  
  },
});
console.log(response.text);

// Close the connection  
await client.close();
```

--------------------------------

### Initialize SDK using Environment Variables (NodeJS)

Source: https://googleapis.github.io/js-genai/release_docs/index

Initializes the GoogleGenAI SDK in a NodeJS environment when environment variables are configured for API access. The SDK automatically picks up the settings.

```javascript
import {GoogleGenAI} from '@google/genai';  
  
const ai = new GoogleGenAI();
```

--------------------------------

### Experimental MCP Support with JavaScript

Source: https://googleapis.github.io/js-genai/release_docs/index

Integrates experimental Model Context Protocol (MCP) support by passing a local MCP server as a tool. This requires the `@google/genai` package and the `@modelcontextprotocol/sdk/client`. It demonstrates connecting to an MCP server, sending a request with MCP tools, and closing the connection.

```javascript
import { GoogleGenAI, FunctionCallingConfigMode , mcpToTool} from '@google/genai';  
import { Client } from "@modelcontextprotocol/sdk/client/index.js";  
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";  
  
// Create server parameters for stdio connection  
const serverParams = new StdioClientTransport({  
  command: "npx", // Executable  
  args: ["-y", "@philschmid/weather-mcp"] // MCP Server  
});  
  
const client = new Client(  
  {  
    name: "example-client",  
    version: "1.0.0"  
  }
);

// Configure the client
const ai = new GoogleGenAI({});

// Initialize the connection between client and server
await client.connect(serverParams);

// Send request to the model with MCP tools
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `What is the weather in London in ${new Date().toLocaleDateString()}?`,
  config: {
    tools: [mcpToTool(client)], // uses the session, will automatically call the tool using automatic function calling
  },
});
console.log(response.text);

// Close the connection
await client.close();
```

--------------------------------

### Initialize Vertex AI with Project and Location

Source: https://googleapis.github.io/js-genai/release_docs/index

Initializes the GoogleGenAI SDK for Vertex AI, requiring project and location details. This is used for integrating with Google Cloud's Vertex AI services.

```javascript
import { GoogleGenAI } from '@google/genai';  
  
const ai = new GoogleGenAI({  
    vertexai: true,  
    project: 'your_project',  
    location: 'your_location',  
});
```

--------------------------------

### Initialization: Gemini Developer API

Source: https://googleapis.github.io/js-genai/release_docs/index

Initialize the Google Gen AI SDK using an API key for the Gemini Developer API. This is suitable for server-side applications.

```APIDOC
### Gemini Developer API

For server-side applications, initialize using an API key, which can be acquired from Google AI Studio:

```javascript
import { GoogleGenAI } from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```

#### Browser

**API Key Security:** Avoid exposing API keys in client-side code. Use server-side implementations in production environments.

In the browser the initialization code is identical:

```javascript
import { GoogleGenAI } from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```
```

--------------------------------

### Initialization - Gemini Developer API

Source: https://googleapis.github.io/js-genai/index

Initialize the GoogleGenAI client using an API key for the Gemini Developer API. Supports server-side and browser environments.

```APIDOC
## Initialization

The Google Gen AI SDK provides support for both the Google AI Studio and Vertex AI implementations of the Gemini API.

### Gemini Developer API

For server-side applications, initialize using an API key, which can be acquired from Google AI Studio:

```javascript
import { GoogleGenAI } from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```

#### Browser

**API Key Security:** Avoid exposing API keys in client-side code. Use server-side implementations in production environments.

In the browser the initialization code is identical:

```javascript
import { GoogleGenAI } from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```
```

--------------------------------

### Session Class - sendRealtimeInput() Method

Source: https://googleapis.github.io/js-genai/release_docs/classes/live

Sends realtime messages, optimized for responsiveness with audio and video.

```APIDOC
## sendRealtimeInput(params: LiveSendRealtimeInputParameters)

### Description
Send a realtime message over the established connection. Optimized for responsiveness, it sends audio and video tokens as they become available.

### Method
sendRealtimeInput

### Endpoint
N/A

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
- **params** (LiveSendRealtimeInputParameters) - Required - An object containing parameters for sending realtime input.
  - **media** (Blob) - Required - The media content (audio or image) to be sent. Only a subset of audio and image mimetypes are allowed.

### Request Example
```javascript
// Assuming 'audioBlob' is a Blob object containing audio data
sendRealtimeInput({ media: audioBlob });
```

### Response
#### Success Response (200)
N/A (This method returns void)

#### Response Example
N/A
```

--------------------------------

### Initialization - Environment Variables (NodeJS)

Source: https://googleapis.github.io/js-genai/index

Initialize the GoogleGenAI client using environment variables for both Gemini Developer API and Vertex AI in NodeJS environments.

```APIDOC
### (Optional) (NodeJS only) Using environment variables:

For NodeJS environments, you can create a client by configuring the necessary environment variables. Configuration setup instructions depends on whether you're using the Gemini Developer API or the Gemini API in Vertex AI.

**Gemini Developer API:** Set `GOOGLE_API_KEY` as shown below:

```bash
export GOOGLE_API_KEY='your-api-key'
```

**Gemini API on Vertex AI:** Set `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION`, as shown below:

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true  
export GOOGLE_CLOUD_PROJECT='your-project-id'  
export GOOGLE_CLOUD_LOCATION='us-central1'
```

```javascript
import {GoogleGenAI} from '@google/genai';  
  
const ai = new GoogleGenAI();
```
```

--------------------------------

### Establish and Close API Session (JavaScript)

Source: https://googleapis.github.io/js-genai/release_docs/classes/live

Demonstrates how to establish a connection to the GenAI API using the 'connect' method and subsequently close the session. It shows conditional model selection based on an environment variable.

```javascript
let model;
if (GOOGLE_GENAI_USE_VERTEXAI) {
  model = 'gemini-2.0-flash-live-preview-04-09';
} else {
  model = 'gemini-live-2.0-flash-preview';
}

const session = await ai.live.connect({
  model: model,
  config: {
    responseModalities: [Modality.AUDIO],
  }
});

session.close();
```

--------------------------------

### LiveMusicSession Methods

Source: https://googleapis.github.io/js-genai/release_docs/classes/music

Documentation for the methods available on the LiveMusicSession object to control music playback and configuration.

```APIDOC
## Methods LiveMusicSession

### close

#### Description
Terminates the WebSocket connection.

#### Method
`close()`

#### Returns
`void`

### pause

#### Description
Temporarily halt the music stream. Use `play` to resume from the current position.

#### Method
`pause()`

#### Returns
`void`

### play

#### Description
Start the music stream.

#### Method
`play()`

#### Returns
`void`

### resetContext

#### Description
Resets the context of the music generation without stopping it. Retains the current prompts and config.

#### Method
`resetContext()`

#### Returns
`void`

### setMusicGenerationConfig

#### Description
Sets a configuration to the model. Updates the session's current music generation config.

#### Method
`setMusicGenerationConfig(params: LiveMusicSetConfigParameters): Promise<void>`

#### Parameters
- **params** (LiveMusicSetConfigParameters) - Required - Contains one property, `musicGenerationConfig`.
  - **musicGenerationConfig** (object) - The music generation configuration to set in the model. Passing an empty or undefined config will reset the config to defaults.

#### Returns
`Promise<void>`

### setWeightedPrompts

#### Description
Sets inputs to steer music generation. Updates the session's current weighted prompts.

#### Method
`setWeightedPrompts(params: LiveMusicSetWeightedPromptsParameters): Promise<void>`

#### Parameters
- **params** (LiveMusicSetWeightedPromptsParameters) - Required - Contains one property, `weightedPrompts`.
  - **weightedPrompts** (Array<{prompt: string, weight: number}>) - The weighted prompts to send to the model; weights are normalized to sum to 1.0.

#### Returns
`Promise<void>`

### stop

#### Description
Stop the music stream and reset the state. Retains the current prompts and config.

#### Method
`stop()`

#### Returns
`void`
```

--------------------------------

### GoogleGenAIOptions Interface

Source: https://googleapis.github.io/js-genai/release_docs/interfaces/client

Configuration options for the Google Gen AI SDK, including API key, version, authentication, HTTP options, location, project, and Vertex AI usage.

```APIDOC
## Interface GoogleGenAIOptions

Google Gen AI SDK's configuration options.
See GoogleGenAI for usage samples.

### Properties

- **apiKey** (string) - Optional - The API Key, required for Gemini API clients. Required on browser runtimes.
- **apiVersion** (string) - Optional - The API version to use. If unset, the default API version will be used.
- **googleAuthOptions** (GoogleAuthOptions<JSONClient>) - Optional - Authentication options defined by the by google-auth-library for Vertex AI clients. Only supported on Node runtimes, ignored on browser runtimes.
- **httpOptions** (HttpOptions) - Optional - A set of customizable configuration for HTTP requests.
- **location** (string) - Optional - The Google Cloud project location for Vertex AI clients. Only supported on Node runtimes, ignored on browser runtimes.
- **project** (string) - Optional - The Google Cloud project ID for Vertex AI clients. Find your project ID: https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects. Only supported on Node runtimes, ignored on browser runtimes.
- **vertexai** (boolean) - Optional - Determines whether to use the Vertex AI or the Gemini API. When true, the Vertex AI API will used. When false, the Gemini API will be used. If unset, default SDK behavior is to use the Gemini API service.
```

--------------------------------

### Create a Chat Session - JavaScript

Source: https://googleapis.github.io/js-genai/release_docs/classes/chats

Demonstrates how to create a new chat session using the `create` method of the Chats class. This method takes parameters for the model and optional configuration settings for the chat session. The configuration provided here will apply to all requests within the session unless overridden.

```javascript
const chat = ai.chats.create({
  model: 'gemini-2.0-flash',
  config: {
    temperature: 0.5,
    maxOutputTokens: 1024,
  }
});
```

--------------------------------

### list

Source: https://googleapis.github.io/js-genai/release_docs/classes/models

Lists available models.

```APIDOC
## GET /models

### Description
Lists available models.

### Method
GET

### Endpoint
/models

### Parameters
#### Query Parameters
- **params** (ListModelsParameters) - Optional - Parameters for listing models.
  - **filter** (string) - Optional - Filter to apply to the list of models.

### Response
#### Success Response (200)
- **Pager<Model>** - A paginated list of models.
  - **models** (Array<Model>) - A list of models.
    - **name** (string) - The name of the model.
    - **version** (string) - The version of the model.
    - **displayName** (string) - The display name of the model.

#### Response Example
```json
{
  "models": [
    {
      "name": "gemini-2.0-flash",
      "version": "1.0",
      "displayName": "Gemini Flash"
    },
    {
      "name": "gemini-2.0-pro",
      "version": "1.0",
      "displayName": "Gemini Pro"
    }
  ]
}
```
```

--------------------------------

### Initialize Gemini Developer API with API Key

Source: https://googleapis.github.io/js-genai/release_docs/index

Initializes the GoogleGenAI SDK for the Gemini Developer API using an API key. This is suitable for server-side applications and also works in the browser.

```javascript
import { GoogleGenAI } from '@google/genai';  
const ai = new GoogleGenAI({apiKey: 'GEMINI_API_KEY'});
```

--------------------------------

### Configure Vertex AI with Environment Variables (NodeJS)

Source: https://googleapis.github.io/js-genai/release_docs/index

Sets environment variables for initializing the Gemini API on Vertex AI in a NodeJS environment. Requires setting `GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, and `GOOGLE_CLOUD_LOCATION`.

```bash
export GOOGLE_GENAI_USE_VERTEXAI=true  
export GOOGLE_CLOUD_PROJECT='your-project-id'  
export GOOGLE_CLOUD_LOCATION='us-central1'
```

--------------------------------

### Initialize LiveMusicSession using WebSocket and ApiClient

Source: https://googleapis.github.io/js-genai/release_docs/classes/music

Constructs a new LiveMusicSession instance, establishing a connection via WebSocket and initializing with an ApiClient. This is an experimental feature.

```typescript
const session = new LiveMusicSession(webSocketConnection, apiClient);
```

--------------------------------

### Initialize gcloud CLI for Authentication

Source: https://googleapis.github.io/js-genai/index

This command initializes the gcloud command-line interface for authenticating your application with Google Cloud. It helps in setting up application-default credentials, which are often required for Vertex AI services.

```bash
gcloud auth application-default login
```

--------------------------------

### List Project Files with @google/genai

Source: https://googleapis.github.io/js-genai/release_docs/classes/files

Lists all current project files from the service using the Files.list method. It accepts optional ListFilesParameters, such as pageSize, and returns a Pager<File> for paginated results.

```typescript
const listResponse = await ai.files.list({config: {'pageSize': 10}}); 
for await (const file of listResponse) { 
  console.log(file.name);
}
```

--------------------------------

### Session Class - sendClientContent() Method

Source: https://googleapis.github.io/js-genai/release_docs/classes/live

Sends content over the established connection, managing conversation turns.

```APIDOC
## sendClientContent(params: LiveSendClientContentParameters)

### Description
Send a message over the established connection. This method adds messages to the model context in order and is suitable for managing conversation turns.

### Method
sendClientContent

### Endpoint
N/A

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
- **params** (LiveSendClientContentParameters) - Required - An object containing parameters for sending client content.
  - **turns** (Content[]) - Optional - An array of content turns to be sent.
  - **turnComplete** (boolean) - Optional - Defaults to `true`. If `true`, indicates that content sending is complete and a response is expected. If `false`, the server waits for additional messages before generating a response.

### Request Example
```javascript
sendClientContent({
    turns: [
      Content({role:user, parts:ப்புகளை: 'Hello?'}),
      Content({role:user, parts:ப்புகளை: 'How are you?'}),
    ]
});

// Or to indicate turn completion without sending new content:
sendClientContent({ turnComplete: true });

// Short form for turn completion:
sendClientContent();
```

### Response
#### Success Response (200)
N/A (This method returns void)

#### Response Example
N/A
```

--------------------------------

### Create Part from Executable Code - JavaScript

Source: https://googleapis.github.io/js-genai/release_docs/modules/types

No description

```javascript
import { createPartFromExecutableCode } from "@google/generative-ai";

async function example() {
  const executableCode = "print('Hello from code!')";
  const part = createPartFromExecutableCode(executableCode);
  console.log(part);
  // Expected output: { executableCode: { code: "print('Hello from code!')" } }
}
```

--------------------------------

### SubjectReferenceImage Class Documentation

Source: https://googleapis.github.io/js-genai/release_docs/classes/types

Provides detailed information about the SubjectReferenceImage class, its properties, constructor, and methods.

```APIDOC
## Class SubjectReferenceImage

A subject reference image.
This encapsulates a subject reference image provided by the user, and additionally optional config parameters for the subject reference image. A raw reference image can also be provided as a destination for the subject to be applied to.

### Constructors

#### `constructor()`

- **Description**: Initializes a new instance of the SubjectReferenceImage class.
- **Method**: `constructor`
- **Endpoint**: N/A
- **Returns**: `SubjectReferenceImage`

### Properties

#### `config` (SubjectReferenceConfig)

- **Description**: Configuration for the subject reference image.
- **Optional**: Yes

#### `referenceId` (number)

- **Description**: The id of the reference image.
- **Optional**: Yes

#### `referenceImage` (Image)

- **Description**: The reference image for the editing operation.
- **Optional**: Yes

#### `referenceType` (string)

- **Description**: The type of the reference image. Only set by the SDK.
- **Optional**: Yes

### Methods

#### `toReferenceImageAPI()`

- **Description**: Converts the SubjectReferenceImage object to the ReferenceImageAPIInternal format.
- **Method**: `toReferenceImageAPI`
- **Endpoint**: N/A
- **Returns**: `ReferenceImageAPIInternal`
```

--------------------------------

### Operations API - Constructor

Source: https://googleapis.github.io/js-genai/release_docs/classes/operations

Initializes a new instance of the Operations class.

```APIDOC
## constructor Operations

### Description
Initializes a new instance of the Operations class.

### Method
CONSTRUCTOR

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
```json
{
  "apiClient": "<ApiClient Object>"
}
```

### Response
#### Success Response (200)
- **Operations** (Operations) - A new instance of the Operations class.

#### Response Example
```json
{
  "instance": "<Operations Instance>"
}
```
```

--------------------------------

### Files API - List Method

Source: https://googleapis.github.io/js-genai/release_docs/classes/files

Lists all current project files from the service. Supports pagination for managing large numbers of files.

```APIDOC
## GET /v1/files

### Description
Lists all current project files from the service.

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Query Parameters
- **pageSize** (integer) - Optional - The number of files to return per page. Defaults to 10.
- **pageToken** (string) - Optional - A token identifying a page of results to retrieve.

### Request Example
```json
{
  "pageSize": 10
}
```

### Response
#### Success Response (200)
- **files** (array) - A list of file objects.
- **nextPageToken** (string) - A token to retrieve the next page of results.

#### Response Example
```json
{
  "files": [
    {
      "name": "files/mehozpxf877d",
      "displayName": "example.txt",
      "mimeType": "text/plain",
      "createTime": "2023-10-27T10:00:00Z",
      "updateTime": "2023-10-27T10:00:00Z",
      "sizeBytes": 1024
    }
  ],
  "nextPageToken": "some_token"
}
```
```

--------------------------------

### Generate Videos using JavaScript

Source: https://googleapis.github.io/js-genai/release_docs/classes/models

Generates videos based on a text description and configuration. This function initiates a video generation process and returns an operation object that allows tracking the progress. Once complete, the operation contains the URI of the generated video. It requires a model name, source prompt, and configuration for the number of videos.

```javascript
const operation = await ai.models.generateVideos({
 model: 'veo-2.0-generate-001',
 source: {
   prompt: 'A neon hologram of a cat driving at top speed',
 },
 config: {
   numberOfVideos: 1
});

while (!operation.done) {
  await new Promise(resolve => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({operation: operation});
}

console.log(operation.response?.generatedVideos?.[0]?.video?.uri);
```

--------------------------------

### Steer Music Generation with Weighted Prompts in LiveMusicSession

Source: https://googleapis.github.io/js-genai/release_docs/classes/music

Enables steering music generation by setting weighted prompts. This method allows users to influence the output by providing prompts with associated weights. It returns a Promise<void> and is an experimental feature.

```typescript
const prompts = {
  weightedPrompts: [{ prompt: 'upbeat jazz', weight: 0.8 }, { prompt: 'slow blues', weight: 0.2 }]
};
session.setWeightedPrompts(prompts);
```

--------------------------------

### generateVideos

Source: https://googleapis.github.io/js-genai/release_docs/classes/models

Generates videos based on a text description and configuration.

```APIDOC
## POST /generateVideos

### Description
Generates videos based on a text description and configuration.

### Method
POST

### Endpoint
/generateVideos

### Parameters
#### Request Body
- **params** (GenerateVideosParameters) - Required - The parameters for generating videos.
  - **model** (string) - Required - The model to use for video generation.
  - **source** (VideoSource) - Required - The source for video generation.
    - **prompt** (string) - Required - The prompt describing the video content.
  - **config** (VideoGenerationConfig) - Optional - Configuration for video generation.
    - **numberOfVideos** (number) - Optional - The number of videos to generate.

### Request Example
```json
{
  "model": "veo-2.0-generate-001",
  "source": {
    "prompt": "A neon hologram of a cat driving at top speed"
  },
  "config": {
    "numberOfVideos": 1
  }
}
```

### Response
#### Success Response (200)
- **GenerateVideosOperation** - An operation object to track the video generation progress.
  - **done** (boolean) - Indicates if the operation is complete.
  - **response** (GenerateVideosResponse) - The response containing generated videos once the operation is done.
    - **generatedVideos** (Array<GeneratedVideo>) - Optional - A list of generated videos.
      - **video** (Video) - Optional - The generated video.
        - **uri** (string) - Optional - The URI of the generated video.

#### Response Example
```json
{
  "done": false,
  "name": "operations/xyz123",
  "response": null
}
```
```

--------------------------------

### Initialize Vertex AI with Project and Location

Source: https://googleapis.github.io/js-genai/index

This code snippet initializes the Google Gen AI SDK for Vertex AI. It requires specifying your Google Cloud project ID and the desired location. Ensure Vertex AI API is enabled and authentication is configured.

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    vertexai: true,
    project: 'your_project',
    location: 'your_location',
});
```

--------------------------------

### Initialize SDK using Environment Variables (NodeJS)

Source: https://googleapis.github.io/js-genai/index

This JavaScript code initializes the Google Gen AI SDK when environment variables for authentication (like GOOGLE_API_KEY or Vertex AI credentials) are already set. This is a convenient way to configure the SDK in NodeJS applications.

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI();
```

--------------------------------

### GoogleGenAI Properties

Source: https://googleapis.github.io/js-genai/release_docs/classes/client

This section outlines the available properties of the GoogleGenAI class, representing different features and states of the SDK.

```APIDOC
## GoogleGenAI Properties

### `Readonly`authTokens
- **Type**: Tokens
- **Description**: Provides access to authentication tokens.

### `Readonly`batches
- **Type**: Batches
- **Description**: Provides access to batch operations.

### `Readonly`caches
- **Type**: Caches
- **Description**: Provides access to caching mechanisms.

### `Readonly`chats
- **Type**: Chats
- **Description**: Provides access to chat-related features.

### `Readonly`files
- **Type**: Files
- **Description**: Provides access to file management operations.

### `Readonly`live
- **Type**: Live
- **Description**: Provides access to live features or real-time data.

### `Readonly`models
- **Type**: Models
- **Description**: Provides access to model management and interaction.

### `Readonly`operations
- **Type**: Operations
- **Description**: Provides access to ongoing or completed operations.

### `Readonly`tunings
- **Type**: Tunings
- **Description**: Provides access to model tuning functionalities.

### `Readonly`vertexai
- **Type**: boolean
- **Description**: Indicates whether the SDK is configured to use the Vertex AI API.
```