const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const TurndownService = require('turndown');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');

const turndownService = new TurndownService();
const argv = yargs(hideBin(process.argv)).argv;
const searchTerm = argv.term;

if (!searchTerm) {
  console.error('Please provide a search term using --term');
  process.exit(1);
}

const encodedTerm = encodeURIComponent(searchTerm);
const baseDir = path.join(__dirname, 'data', searchTerm);
const articlesDir = path.join(baseDir, 'articles');
const failedLogs = path.join(baseDir, 'failed_urls.log');

async function main() {
  await fs.ensureDir(articlesDir);
  console.log(`Starting scraper for term: ${searchTerm}`);

  let page = 1;
  let allArticles = [];

  while (true) {
    console.log(`Fetching page ${page}...`);
    try {
      const response = await axios.get(`https://www.worldjournal.com/api/more?page=${page}&id=${encodedTerm}&channelId=8877&type=searchword&zh-cn`);
      const { lists, end } = response.data;

      if (!lists || lists.length === 0) break;

      allArticles.push(...lists);
      if (end) break;
      page++;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message);
      break;
    }
  }

  console.log(`Found ${allArticles.length} articles. Starting download...`);

  for (const article of allArticles) {
    await scrapeArticle(article);
    await new Promise(resolve => setTimeout(resolve, 500)); // Politeness
  }

  console.log('Scraping completed.');
}

async function scrapeArticle(article) {
  const url = `${article.titleLink}?zh-cn`;
  const articleId = path.basename(article.titleLink);
  const jsonPath = path.join(baseDir, `${articleId}.json`);

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title = $('h1.article-content__title').text().trim();
    const date = $('time.article-content__time').text().trim();
    const author = $('span.article-content__author').text().trim();
    const bodyHtml = $('section.article-content__editor').html();

    if (!bodyHtml) throw new Error('Could not find article body');

    const markdown = turndownService.turndown(bodyHtml);
    const fileName = `${date.split(' ')[0]}_${title.replace(/\//g, '-')}.md`.replace(/:/g, '');
    const mdPath = path.join(articlesDir, fileName);

    await fs.writeJson(jsonPath, { metadata: article, title, date, author, url });
    await fs.writeFile(mdPath, `# ${title}\n\n**Date:** ${date}\n**Author:** ${author}\n\n${markdown}`);
    
    console.log(`Saved: ${title}`);
  } catch (error) {
    console.error(`Failed to scrape ${url}: ${error.message}`);
    await fs.appendFile(failedLogs, `${url}\n`);
  }
}

main();
