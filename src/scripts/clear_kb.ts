import 'dotenv/config';
import { VectorDBService } from '../services/vector_db.service.ts';

async function main(): Promise<void> {
    try {
        const vectorDB = new VectorDBService();
        const botId: string = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        // 1. Remove all embeddings from the database for a specific bot by bot ID
        // const url = 'https://www.justdigitalpeople.com.au/';
        // const { count: itemsCount } = await vectorDB.deleteByBotIdAndMetadataSource(botId, url);
        const { count: itemsCount } = await vectorDB.deleteByBotId(botId);
        console.log('Deleted items:', itemsCount);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
