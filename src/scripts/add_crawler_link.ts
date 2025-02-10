import 'dotenv/config';
import { addCrawlerLink } from '../services/bot.service.ts';

// List of URLs to process
const urls = ['https://www.pabtranslation.co.uk'];
async function main(): Promise<void> {
    try {
        console.log('[!] Add crawler link');
        // Ensure bot ID is provided as an argument in CLI
        // const botId = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        const botId = process.argv[2];
        if (!botId) {
            console.error('Please provide a bot ID');
            process.exit(1);
        }
        const url = process.argv[3];
        if (!url) {
            console.error('Please provide a URL');
            process.exit(1);
        }

        await addCrawlerLink(botId, url);

        console.log('Done ✅');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
