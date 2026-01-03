import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env explicitly
dotenv.config({ path: join(__dirname, '.env') });

console.log("Checking environment...");
console.log("Details: API Key present?", !!process.env.OPENAI_API_KEY ? "YES" : "NO");

if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is missing in server/.env");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testConnection() {
    try {
        console.log("Sending test request to OpenAI...");
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Test connection." }],
            max_tokens: 5
        });
        console.log("SUCCESS: Connection established!");
        console.log("Response:", response.choices[0].message.content);
    } catch (error) {
        console.error("FAILURE: OpenAI API Error");
        console.error(error);
    }
}

testConnection();
