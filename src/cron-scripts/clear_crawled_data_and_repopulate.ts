import 'dotenv/config';
import {
    getAutoUpdateBots,
    getCrawlerLinks,
    populateKBFromCrawlerResults,
    populateKBFromFiles,
} from '../services/bot.service.ts';
import { VectorDBService } from '../services/vector_db.service.js';

async function main(): Promise<void> {
    try {
        const vectorDB = new VectorDBService();

        const bots = await getAutoUpdateBots();

        let i = 0;
        const len = bots.length;
        for (const bot of bots) {
            i++;
            console.log(`${i}/${len} - Bot ID: ${bot.id}`);
            const botId = bot.id;
            // 1. Remove all embeddings from the database for a specific bot by bot ID
            const { count: itemsCount } = await vectorDB.deleteByBotId(botId);
            console.log('Deleted items:', itemsCount);
            // 2. Repopulate the vector database with new embeddings
            // FROM Files
            await populateKBFromFiles(botId);

            // FROM crawler
            const urls = await getCrawlerLinks(botId);
            for (const url of urls) {
                try {
                    await populateKBFromCrawlerResults(botId, url);
                } catch (error) {
                    console.error(error);
                }
            }
        }
        console.log('Done ✅');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
