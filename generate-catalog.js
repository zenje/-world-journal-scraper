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
      const englishTitleMatch = content.match(/## (.*)/m); 
      
      articles.push({
        file,
        title: titleMatch ? titleMatch[1] : 'Unknown',
        englishTitle: englishTitleMatch ? englishTitleMatch[1] : 'No translation',
        date: dateMatch ? dateMatch[1] : '0000-00-00'
      });
    }
  }

  // Sort by date oldest to newest
  articles.sort((a, b) => a.date.localeCompare(b.date));

  // Generate README content
  let mdContent = `# Article Catalog: ${term}\n\n`;
  mdContent += `| Date | Chinese Title | English Title |\n| --- | --- | --- |\n`;
  
  for (const article of articles) {
    mdContent += `| ${article.date} | [${article.title}](articles/${encodeURIComponent(article.file)}) | ${article.englishTitle} |\n`;
  }

  await fs.writeFile(path.join(__dirname, 'data', term, 'README.md'), mdContent);
  console.log(`Catalog generated for ${term}`);
}

generateCatalog(term);
