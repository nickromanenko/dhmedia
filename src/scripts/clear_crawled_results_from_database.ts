import 'dotenv/config';
import { VectorDBService, type EmbeddingRecord } from '../services/vector_db.service.js';

async function main(): Promise<void> {
    try {
        const botId = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        const vectorDB = new VectorDBService();
        const items = (await vectorDB.getAllEmbeddingsByBotId(botId)).filter(
            (item: EmbeddingRecord) =>
                item.metadata.source.includes('https://www.justdigitalpeople.com.au'),
        );
        const ids = items.map((item: EmbeddingRecord) => item.id);

        await vectorDB.deleteEmbeddings(ids);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
