import 'dotenv/config';
import { populateKBFromCrawlerResults } from '../services/bot.service.ts';

async function main(): Promise<void> {
    try {
        console.log('[!] Populating KB from crawler results');
        // Ensure bot ID is provided
        const botId = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        if (!botId) {
            console.error('Please provide a bot ID');
            process.exit(1);
        }
        const url =
            'https://crawler.doghouse.agency/site/130/output/all?limit=500&page=1&filter%5Bresponse%5D=success&content%5Bis_job_type%5D=1';

        await populateKBFromCrawlerResults(botId, url);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
