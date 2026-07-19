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
  
  // Extract metadata for the prompt
  const urlMatch = content.match(/\*\*URL:\*\* (.*)/);
  const url = urlMatch ? urlMatch[1] : '';

  // Prompt for translation and enriched vocab
  const prompt = `
    Read the following Chinese article text:
    ---
    ${content}
    ---
    1. Provide the English translation of the article title.
    2. Translate the entire article content into natural-sounding English.
    3. Extract key vocabulary terms that are HSK level 5 or higher.
       - Sort them by their approximate frequency in Chinese (most frequent first).
    4. For each term, provide:
       - Its English definition.
       - Its estimated HSK level (5 or 6).
       - A short sentence or fragment from the original article where it appears.
    
    Return the result in JSON format ONLY, with these fields:
    {
      "english_title": "string",
      "english_translation": "string",
      "vocabulary": [{"term": "string", "definition": "string", "hsk_level": 5 or 6, "example": "string"}]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, '');
    const data = JSON.parse(jsonStr);

    // Clean article content: keep only the header and body, remove everything else
    const cleanContent = content.split('---')[0].trim();

    // Format as Markdown
    let output = `${cleanContent}\n\n---\n## ${data.english_title}\n${data.english_translation}\n\n## Key Vocabulary (HSK 5+)\n| Term | Definition | HSK | Example |\n| --- | --- | --- | --- |\n`;
    data.vocabulary.forEach(v => {
      output += `| ${v.term} | ${v.definition} | ${v.hsk_level} | ${v.example} |\n`;
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
