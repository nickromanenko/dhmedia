import 'dotenv/config';

import { loadAndProcessWebPages } from '../services/bot.service.ts';

// List of URLs to process
const urls = ['https://www.pabtranslation.co.uk'];
async function main(): Promise<void> {
    try {
        console.log('[!] Populating KB from files');
        // Ensure bot ID is provided
        const botId = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        if (!botId) {
            console.error('Please provide a bot ID');
            process.exit(1);
        }
        await loadAndProcessWebPages(botId, urls);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
