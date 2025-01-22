import 'dotenv/config';
import { botService } from '../services/bot.service.ts';

async function main(): Promise<void> {
    try {
        const botId: string = '1d9cbac8-d42a-4408-b78f-caefc6e327af';
        const messages = await botService.getAllBotMessages(botId);
        console.log('Messages:', messages);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
