import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env explicitly
dotenv.config({ path: join(__dirname, '.env') });

console.log("Checking Mistral environment...");
console.log("Details: API Key present?", !!process.env.MISTRAL_API_KEY ? "YES" : "NO");

if (!process.env.MISTRAL_API_KEY) {
    console.error("ERROR: MISTRAL_API_KEY is missing in server/.env");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY,
    baseURL: "https://api.mistral.ai/v1"
});

async function testConnection() {
    try {
        console.log("Sending test request to Mistral...");
        const response = await openai.chat.completions.create({
            model: "mistral-tiny",
            messages: [{ role: "user", content: "Say 'Success' if connected." }],
            max_tokens: 10
        });
        console.log("SUCCESS: Connection established!");
        console.log("Response:", response.choices[0].message.content);
    } catch (error) {
        console.error("FAILURE: Mistral API Error");
        console.error(error);
    }
}

testConnection();
