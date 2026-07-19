require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).listModels();
  // Note: The SDK might not have a direct listModels on the model instance, 
  // checking the documentation/structure implies looking at the AI instance or just trying a common valid model.
  
  // Let's try listing models directly from the GenAI instance if possible or list valid ones.
  console.log('Listing models...');
  // Actually, let's just try 'gemini-1.5-flash' again, but without the v1beta prefix, 
  // or check if 'gemini-1.5-flash' is the correct name.
  // Wait, let's try 'gemini-1.5-flash' as per official docs.
}
// Actually, I can just try 'gemini-1.5-flash' again, but ensure it is the *exact* name.
// Many users had issues with missing the '001' or similar. 
// Let's try 'gemini-1.5-flash' again. Maybe it was a temporary API issue.
// Alternatively, try 'gemini-1.5-flash-latest' or just 'gemini-1.5-flash'.

// Re-thinking: The error said `models/gemini-1.5-flash-001 is not found`. 
// Let's try 'gemini-1.5-flash'.
