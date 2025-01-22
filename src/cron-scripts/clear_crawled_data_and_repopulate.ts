import 'dotenv/config';
import { populateKBFromCrawlerResults, populateKBFromFiles } from '../services/bot.service.ts';
import { VectorDBService } from '../services/vector_db.service.js';

async function main(): Promise<void> {
    try {
        const vectorDB = new VectorDBService();
        const botId: string = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        // 1. Remove all embeddings from the database for a specific bot by bot ID
        // const url = 'https://www.justdigitalpeople.com.au/';
        // const { count: itemsCount } = await vectorDB.deleteByBotIdAndMetadataSource(botId, url);
        const { count: itemsCount } = await vectorDB.deleteByBotId(botId);
        console.log('Deleted items:', itemsCount);
        // 2. Repopulate the vector database with new embeddings

        // FROM Files
        await populateKBFromFiles(botId);

        // FROM crawler
        const url =
            'https://crawler.doghouse.agency/site/130/output/all?limit=500&page=1&filter%5Bresponse%5D=success&content%5Bis_job_type%5D=1';
        await populateKBFromCrawlerResults(botId, url);

        console.log('Done ✅');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
