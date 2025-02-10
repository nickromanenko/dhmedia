import 'dotenv/config';
import { populateKBFromCrawlerResults } from '../services/bot.service.ts';

async function main(): Promise<void> {
    try {
        console.log('[!] Populating KB from crawler results');
        // Ensure bot ID is provided as an argument in CLI
        const botId = process.argv[2];
        if (!botId) {
            console.error('Please provide a bot ID');
            process.exit(1);
        }
        const urls = [
            'https://crawler.doghouse.agency/site/130/output/all?limit=500&page=1&filter%5Bresponse%5D=success&content%5Bis_job_type%5D=1',
        ];

        for (const url of urls) {
            try {
                await populateKBFromCrawlerResults(botId, url);
            } catch (error) {
                console.error('Error:', error);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
