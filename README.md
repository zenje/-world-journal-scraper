# World Journal Scraper & Enhancer

This project is a personal tool designed to scrape, preserve, and enhance writings from the World Journal (世界新闻网). Specifically, it was created to archive the literary works of **彭丽荷 (Peng Lihe)**, making them accessible as clean Markdown files and creating a valuable study resource by providing English translations and HSK-targeted vocabulary.

## Project Structure
- `scraper.js`: Node.js script to discover and fetch articles from World Journal via their search API.
- `enhance.js`: Node.js script that processes saved Markdown files using the Google Gemini API to add English translations and extract key HSK 5+ vocabulary.
- `data/`: Directory where raw JSON metadata and processed Markdown articles are stored.

## Features
- **Dynamic Scraping**: Scrape articles for any search term.
- **Clean Output**: Automatically removes ads, navigation noise, and scripts to produce readable Markdown.
- **Enrichment**: AI-powered translation and vocabulary extraction with HSK-level tagging.
- **Robustness**: Handles pagination, logs failures, and uses polite request delays.

## Getting Started

### Prerequisites
- Node.js (v22+ recommended)
- A Google Gemini API Key

### Installation
1. Clone this repository (or copy the files).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file in the root directory:
   ```text
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Usage

### 1. Scrape Articles
Run the scraper for a specific term:
```bash
node scraper.js --term "彭丽荷"
```
Articles will be saved in `data/<term>/articles/`.

### 2. Enhance Articles (Translation & Vocab)
Process all articles for a term:
```bash
node enhance.js --term "彭丽荷"
```
Or process a single file:
```bash
node enhance.js --file "data/彭丽荷/articles/<filename>.md"
```

---
*Note: This project was generated with the help of Gemini.*
