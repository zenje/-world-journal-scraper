import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

const argv = yargs(hideBin(process.argv)).argv;
const { term, file } = argv;

async function enhanceArticle(filePath) {
  console.log(`Processing: ${filePath}`);
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Check if already enhanced to avoid redundant API calls
  if (content.includes('## English Translation')) {
    console.log(`Already enhanced: ${filePath}`);
    return;
  }
  
  const prompt = `
    Read the following Chinese article text:
    ---
    ${content}
    ---
    1. Translate the entire article into natural-sounding English.
    2. Extract key vocabulary terms that are HSK level 5 or higher.
    3. For each term, provide its English definition and its estimated HSK level (5 or 6).
    
    Return the result in JSON format ONLY, with these fields:
    {
      "english_translation": "string",
      "vocabulary": [{"term": "string", "definition": "string", "hsk_level": 5 or 6}]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting in response
    const jsonStr = text.replace(/```json\n?|\n?```/g, '');
    const data = JSON.parse(jsonStr);

    // Format as Markdown
    let output = `${content}\n\n---\n## English Translation\n${data.english_translation}\n\n## Key Vocabulary (HSK 5+)\n| Term | Definition | HSK Level |\n| --- | --- | --- |\n`;
    data.vocabulary.forEach(v => {
      output += `| ${v.term} | ${v.definition} | ${v.hsk_level} |\n`;
    });

    await fs.writeFile(filePath, output);
    console.log(`Enhanced: ${filePath}`);
  } catch (error) {
    console.error(`Failed to enhance ${filePath}: ${error.message}`);
  }
}

async function main() {
  if (file) {
    await enhanceArticle(path.resolve(file));
  } else if (term) {
    const dir = path.join(__dirname, 'data', term, 'articles');
    if (!await fs.exists(dir)) {
        console.error(`Directory not found: ${dir}`);
        return;
    }
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (f.endsWith('.md')) await enhanceArticle(path.join(dir, f));
    }
  } else {
    console.error('Provide --term (for all) or --file (for one).');
  }
}

main();
