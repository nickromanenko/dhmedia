import { populateKBFromCrawlerResults } from './populate_kb_from_crawler_results.ts';

async function main(): Promise<void> {
    try {
        console.log('Populating KB from crawler results...');
        // Ensure bot ID is provided
        const botId = process.argv[2];
        if (!botId) {
            console.error('Please provide a bot ID as an argument');
            process.exit(1);
        }

        await populateKBFromCrawlerResults(botId);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
