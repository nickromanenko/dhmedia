import 'dotenv/config';
import { VectorDBService, type EmbeddingRecord } from '../services/vector_db.service.js';

async function main(): Promise<void> {
    try {
        const vectorDB = new VectorDBService();
        const items = (
            await vectorDB.getAllEmbeddingsByBotId('37ae52cc-89b5-4ae0-bcb2-3319e32d7142')
        ).filter((item: EmbeddingRecord) =>
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
