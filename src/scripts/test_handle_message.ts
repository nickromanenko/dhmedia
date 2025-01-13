import { botService } from '../services/bot.service.ts';

async function main(): Promise<void> {
    const response = await botService.handleMessage(
        '37ae52cc-89b5-4ae0-bcb2-3319e32d7142',
        'What is the name of a project with ID 77711111?',
        // 'What is a sum of 2 and 5?',
        'OQJY6GRCEA1234',
    );
    console.log(response.content);
    return;
}

main().catch(console.error);
