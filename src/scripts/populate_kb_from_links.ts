import colors from 'colors';
import 'dotenv/config';

import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { botService } from '../services/bot.service.ts';
import { VectorDBService } from '../services/vector_db.service.js';

// List of URLs to process
const urls = ['https://www.pabtranslation.co.uk'];

try {
    async function loadAndProcessWebPages(botId: string): Promise<void> {
        const bot = await botService.getBotById(botId);
        if (!bot) {
            throw new Error(`Bot not found: ${botId}`);
        }

        const vectorDB = new VectorDBService();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        console.log(colors.blue(`Found ${urls.length} URLs to process`));

        let i = 0;
        const len = urls.length;
        for (const url of urls) {
            try {
                i++;
                console.log(`${i}/${len} - ${url}`.yellow);

                // Load webpage
                const loader = new CheerioWebBaseLoader(url, {
                    selector: 'body', // Scrape the entire body content
                });
                const docs = await loader.load();

                // Split into chunks
                const chunks = await textSplitter.splitDocuments(docs);

                // Prepare chunks for storage
                const items = chunks.map((chunk: Document) => ({
                    content: chunk.pageContent,
                    metadata: {
                        ...chunk.metadata,
                        source: url,
                    },
                }));

                // Store embeddings in batches
                const result = await vectorDB.batchStoreEmbeddings(botId, items);
                console.log(`Stored ${result.count} embeddings for ${url}`);
            } catch (error) {
                console.error(`Error processing ${url}:`.red, error);
                process.exit(1);
            }
        }
    }

    // Get bot ID from command line arguments
    const botId = process.argv[2];
    if (!botId) {
        console.error('Please provide a bot ID as a command line argument');
        process.exit(1);
    } else {
        console.log('OK, processing web pages for bot ID:', botId);
    }

    // Run the script
    loadAndProcessWebPages(botId)
        .then(() => {
            console.log('Finished processing all web pages');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
