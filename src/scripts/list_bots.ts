import { Bot } from '@prisma/client';
import { botService } from '../services/bot.service.ts';

async function listBots(): Promise<void> {
    try {
        const bots = await botService.getAllBots();

        if (bots.length === 0) {
            console.log('No bots found in the database.');
            return;
        }

        console.log('\nBots in the database:\n');
        bots.forEach((bot: Bot, index: number) => {
            console.log(`${index + 1}. ${bot.name}`);
            console.log(`   ID: ${bot.id}`);
            console.log(`   Model: ${bot.model}`);
            console.log(`   Description: ${bot.description || 'N/A'}`);
            console.log(`   Created: ${bot.created_at.toLocaleString()}`);
            console.log('');
        });
    } catch (error) {
        console.error(
            'Failed to list bots:',
            error instanceof Error ? error.message : 'Unknown error',
        );
        process.exit(1);
    }
}

listBots().catch((error) => console.error(error));
