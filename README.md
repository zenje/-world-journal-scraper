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

## The Enhancement Pipeline
The enhancement process uses the **Google Gemini API** (via the `@google/generative-ai` library) to process scraped Chinese articles.

### How it works:
1.  **Translation**: The model translates the article title and body into natural-sounding English.
2.  **Vocabulary Extraction**: The model identifies terms that are HSK level 5 or higher.
3.  **Frequency Sorting**: The model sorts the extracted vocabulary based on its approximate frequency in general Chinese usage (from most frequent to least frequent).
4.  **Enrichment**: Each vocabulary item includes:
    - English Definition.
    - Estimated HSK Level (5 or 6).
    - An example fragment taken directly from the article for context.

*Note: This enrichment relies on the LLM's internal linguistic knowledge and training data, providing a robust, context-aware analysis without needing external static frequency tables.*

## Getting Started

### Prerequisites
- Node.js (v22+ recommended)
- A Google Gemini API Key

### Installation
1. Clone this repository.
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
