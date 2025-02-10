import 'dotenv/config';
import { populateKBFromFiles } from '../services/bot.service.ts';

async function main(): Promise<void> {
    try {
        console.log('[!] Populating KB from files');
        // Ensure bot ID is provided as an argument in CLI
        // const botId = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        const botId = process.argv[2];
        if (!botId) {
            console.error('Please provide a bot ID');
            process.exit(1);
        }
        await populateKBFromFiles(botId);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
