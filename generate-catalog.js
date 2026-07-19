import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = yargs(hideBin(process.argv)).argv;
const term = argv.term;

if (!term) {
  console.error('Please provide a search term using --term');
  process.exit(1);
}

async function generateCatalog(term) {
  const articlesDir = path.join(__dirname, 'data', term, 'articles');
  if (!await fs.exists(articlesDir)) {
    console.error(`Directory not found: ${articlesDir}`);
    return;
  }
  
  const files = await fs.readdir(articlesDir);
  const articles = [];

  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = await fs.readFile(path.join(articlesDir, file), 'utf-8');
      
      // Extract metadata
      const titleMatch = content.match(/^# (.*)/m);
      const dateMatch = content.match(/\*\*Date:\*\* ([\d-]+)/);
      
      // Find the translation section - looking for ## [Translated Title] then the text until ## Key Vocabulary
      const translationSectionMatch = content.match(/## (?:[^\n]*)\n([\s\S]*?)\n\n## Key Vocabulary/m);
      
      let summary = 'No summary available';
      let englishTitle = 'No translation';
      
      const englishTitleMatch = content.match(/^## (.*)/m);
      if (englishTitleMatch) englishTitle = englishTitleMatch[1];

      if (translationSectionMatch) {
         // Clean up translation text: remove newlines, trim
         const translation = translationSectionMatch[1].replace(/\n+/g, ' ').trim();
         // Split into sentences
         const sentences = translation.split(/[.!?](?:\s|$)/).filter(s => s.trim().length > 0);
         summary = sentences.slice(0, 2).join('. ') + '.';
      }
      
      articles.push({
        file,
        title: titleMatch ? titleMatch[1] : 'Unknown',
        englishTitle,
        summary,
        date: dateMatch ? dateMatch[1] : '0000-00-00'
      });
    }
  }

  // Sort by date oldest to newest
  articles.sort((a, b) => a.date.localeCompare(b.date));

  // Generate README content
  let mdContent = `# Article Catalog: ${term}\n\n`;
  mdContent += `| Date | Chinese Title | English Title | Summary |\n| --- | --- | --- | --- |\n`;
  
  for (const article of articles) {
    // Escape pipes and remove any rogue newlines to prevent table breaks
    const safeSummary = article.summary.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    mdContent += `| ${article.date} | [${article.title}](articles/${encodeURIComponent(article.file)}) | ${article.englishTitle} | ${safeSummary} |\n`;
  }

  await fs.writeFile(path.join(__dirname, 'data', term, 'README.md'), mdContent);
  console.log(`Catalog generated for ${term}`);
}

generateCatalog(term);
