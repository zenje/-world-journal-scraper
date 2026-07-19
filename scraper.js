import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import TurndownService from 'turndown';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenCC from 'opencc-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const turndownService = new TurndownService();
const converter = OpenCC.Converter({ from: 't', to: 'cn' });

const argv = yargs(hideBin(process.argv)).argv;
const { term, recover, url: targetUrl, check } = argv;

async function main() {
  const searchTerm = term || 'recovered_urls';
  
  if (check) {
    console.log(`Running check mode for term: ${searchTerm}`);
    await checkLinks(searchTerm);
    return;
  }
  // ... (rest of main)

async function checkLinks(searchTerm) {
  const encodedTerm = encodeURIComponent(searchTerm);
  let page = 1;
  const urlsToCheck = [];
  while (true) {
    console.log(`Fetching page ${page}...`);
    const response = await axios.get(`https://www.worldjournal.com/api/more?page=${page}&id=${encodedTerm}&channelId=8877&type=searchword&zh-cn`);
    const { lists, end } = response.data;
    if (!lists || lists.length === 0) break;
    urlsToCheck.push(...lists.map(a => a.titleLink));
    if (end) break;
    page++;
  }

  console.log(`Checking ${urlsToCheck.length} URLs for 404s...`);
  const failures = [];
  for (const url of urlsToCheck) {
    try {
      await axios.get(`${url}?zh-cn`);
      console.log(`OK: ${url}`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`404 detected: ${url}`);
        failures.push(url);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const logPath = path.join(__dirname, 'data', searchTerm, 'detected_failures.log');
  await fs.writeFile(logPath, failures.join('\n') + '\n');
  console.log(`Check complete. ${failures.length} failures logged to ${logPath}`);
}

  console.log(`Processing ${urlsToScrape.length} URLs...`);
  const report = { success: [], failed: [] };

  for (const url of urlsToScrape) {
    const success = await scrapeArticle({ titleLink: url.replace('?zh-cn', '') }, recover, searchTerm);
    if (success) report.success.push(url);
    else report.failed.push(url);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n--- Summary ---');
  console.log(`Successfully processed: ${report.success.length}`);
  console.log(`Failed: ${report.failed.length}`);
  if (report.failed.length > 0) console.log('Failed URLs:', report.failed);
}

async function scrapeArticle(article, isRecoverMode, searchTerm) {
  let url = `${article.titleLink}?zh-cn`;
  let isArchived = false;

  // Pre-check: Does the file already exist?
  const articleId = path.basename(article.titleLink);
  const files = await fs.readdir(path.join(__dirname, 'data', searchTerm, 'articles'));
  
  // We need a way to guess the filename to check for existence without parsing the whole HTML first
  // The filename depends on date and title, which we don't know until we fetch.
  // As a simpler approach: check if any file in the directory contains the articleId or similar unique identifier
  // However, given our current structure, checking existence is hard without fetching.
  // A better approach is to check if we already have the JSON metadata file, which we save.
  const jsonPath = path.join(__dirname, 'data', searchTerm, `${articleId}.json`);
  if (await fs.exists(jsonPath)) {
    console.log(`Skipping existing article: ${articleId}`);
    return true;
  }

  try {
    const response = await axios.get(url);
    await processAndSave(response.data, url, article.titleLink, isArchived, searchTerm);
    return true;
  } catch (error) {
    if (isRecoverMode) {
      console.log(`Trying archive for: ${article.titleLink}`);
      try {
        const cleanUrl = article.titleLink.replace('?zh-cn', '');
        const archiveResp = await axios.get(`https://archive.org/wayback/available?url=${cleanUrl}`);
        const snapshot = archiveResp.data.archived_snapshots?.closest?.url;
        console.log(`Snapshot found: ${snapshot}`);
        if (snapshot) {
          const resp = await axios.get(snapshot, { maxRedirects: 5 });
          await processAndSave(resp.data, url, cleanUrl, true, searchTerm);
          return true;
        }
      } catch (archErr) {
        console.error(`Archive request failed for ${article.titleLink}: ${archErr.message}`);
      }
    }
    console.error(`Failed: ${article.titleLink}`);
    return false;
  }
}

async function processAndSave(html, url, originalLink, isArchived, searchTerm) {
  const $ = cheerio.load(html);
  // Aggressively remove unwanted elements
  $('script, style, .article-content__ads, .admarutag, [id^="div-gpt-ad"], .article-content__nav, .tips, .article-content__sidebar, #div-gpt-ad-1617286621665-0, .article-content__lastnews, .article-content__nextnews').remove();
  $('div:contains("上一则"), div:contains("下一则")').remove();
  $('a[href*="from=wj_lastnews_story"], a[href*="from=wj_nextnews_story"]').parent().parent().remove();

  const title = $('h1.article-content__title').text().trim();
  const date = $('time.article-content__time').text().trim();
  const author = $('span.article-content__author').text().trim();
  const bodyHtml = $('section.article-content__editor').html();

  if (!title || !bodyHtml) throw new Error('Content parsing failed');

  let markdown = turndownService.turndown(bodyHtml);
  if (isArchived) {
    markdown = converter(markdown);
  }

  const datePart = date.split(' ')[0] || 'unknown';
  const suffix = isArchived ? '_recovered' : '';
  const fileName = `${datePart}_${title.replace(/\//g, '-')}${suffix}.md`.replace(/:/g, '');
  const mdPath = path.join(__dirname, 'data', searchTerm, 'articles', fileName);

  await fs.writeFile(mdPath, `# ${title}\n\n**Date:** ${date}\n**Author:** ${author}\n**URL:** ${originalLink}\n\n${markdown}`);
  console.log(`Saved: ${fileName}`);
}

main();
