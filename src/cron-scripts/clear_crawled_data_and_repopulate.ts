import 'dotenv/config';
import { populateKBFromCrawlerResults } from '../scripts/populate_kb_from_crawler_results.ts';
import { VectorDBService } from '../services/vector_db.service.js';

async function main(): Promise<void> {
    try {
        const vectorDB = new VectorDBService();
        const botId: string = '37ae52cc-89b5-4ae0-bcb2-3319e32d7142';

        // 1. Remove all embeddings from the database for a specific bot by bot ID and source
        const url = 'https://www.justdigitalpeople.com.au/';

        const { count: itemsCount } = await vectorDB.deleteByBotIdAndMetadataSource(botId, url);
        console.log('Deleted items:', itemsCount);

        // 2. Repopulate the vector database with new embeddings
        const { count } = await populateKBFromCrawlerResults(botId);
        console.log('Stored items:', count);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
