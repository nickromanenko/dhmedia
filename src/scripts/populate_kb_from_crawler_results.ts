import axios from 'axios';
import 'dotenv/config';
import { botService } from '../services/bot.service.ts';
import { getContentFromPage } from '../services/openai.service.ts';
import { VectorDBService } from '../services/vector_db.service.ts';

export async function populateKBFromCrawlerResults(botId: string): Promise<{ count: number }> {
    const bot = await botService.getBotById(botId);
    if (!bot) {
        throw new Error(`Bot not found: ${botId}`);
    }
    const vectorDB = new VectorDBService();
    const url =
        'https://crawler.doghouse.agency/site/130/output/all?limit=500&page=1&filter%5Bresponse%5D=success&content%5Bis_job_type%5D=1';
    const results = (await axios.get(url)).data.data;
    let i = 0;
    const len = results.length;

    const items = [];
    for (const result of results) {
        i++;
        console.log(`${i}/${len} ${result.title}`);
        const content = await getContentFromPage(bot.api_key!, result.body);
        console.log(content);
        items.push({
            content: `${result.title}\n${content}`,
            metadata: {
                source: result.url,
            },
        });
    }

    const result = await vectorDB.batchStoreEmbeddings(bot.api_key!, botId, items);
    console.log(`Stored ${result.count} embeddings for ${url}`);
    return { count: result.count || 0 };
}
