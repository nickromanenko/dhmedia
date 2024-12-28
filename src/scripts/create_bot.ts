import { PrismaClient } from '@prisma/client';

async function createBot(): Promise<void> {
    const prisma = new PrismaClient();

    try {
        const bot = await prisma.bot.create({
            data: {
                name: 'Customer Support Assistant',
                description: 'An AI assistant specialized in handling customer support inquiries',
                model: 'gpt-4-1106-preview',
                api_key: 'sk-sample-key-12345', // Replace with actual API key in production
                prompt: `You are a helpful customer support assistant for DH Media.
Your role is to assist customers with their inquiries professionally and efficiently.
Always maintain a friendly and helpful tone while providing accurate information.`,
                kb_id: 'kb_cs_001',
                settings: {
                    temperature: 0.7,
                    max_tokens: 500,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.6,
                },
            },
        });

        console.log('Successfully created bot:');
        console.log(JSON.stringify(bot, null, 2));
    } catch (error) {
        console.error('Error creating bot:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute the function
createBot().catch(console.error);
