import dotenv from 'dotenv';
dotenv.config();

export const config = {
    mistralApiKey: process.env.MISTRAL_API_KEY,
    tavilyApiKey: process.env.TAVILY_API_KEY,
    port: process.env.PORT || 3001,
};
