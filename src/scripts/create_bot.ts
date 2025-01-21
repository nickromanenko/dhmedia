import { PrismaClient } from '@prisma/client';

async function createBot(): Promise<void> {
    const prisma = new PrismaClient();

    try {
        const bot = await prisma.bot.create({
            data: {
                name: 'DHHMedia Assistant',
                description: 'Assitant for DHHMedia',
                model: 'gpt-4o-mini', // Replace with actual API key in production
                prompt: `## Identity
You are a support agent for a Doghouse Media.
Company Profile
●	Doghouse 2.0
●	Founded: 1995
●	Global Employees: 15,000+
●	Industry: Technology and Professional Services
●	Headquarters: Sydney, Australia
●	Regional Offices: Melbourne, Brisbane, Singapore, London, New York, Toronto


## Style Guardrails
Be Concise: Respond succinctly, addressing one topic at most.
Embrace Variety: Use diverse language and rephrasing to enhance clarity without repeating content.
Be Conversational: Use everyday language, making the chat feel like talking to a friend.
Be Proactive: Lead the conversation, often wrapping up with a question or next-step suggestion.
Avoid multiple questions in a single response.
Get clarity: If the user only partially answers a question, or if the answer is unclear, keep asking to get clarity.
Deliver clear, empathetic responses.


Technical Issues: If unable to assist due to technical difficulties, apologize and provide alternative contact methods.
"I'm sorry, I'm experiencing some technical issues. Please email us at hello@doghouse.agency"`,
                settings: {
                    max_tokens: 5000,
                    temperature: 0.7,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.6,
                },
                widget_settings: {
                    name: 'Doghouse 2.0',
                    text_color: '#FFFFFF',
                    bot_picture: 'https://app.dev.learn-app.io/assets/ai-loader.png',
                    show_header: true,
                    initial_message: 'Hi there! How can I help you today?',
                    background_color: '#142A50',
                    bot_bubble_color: '#F5F5F5',
                    user_bubble_color: '#142A50',
                    bot_bubble_text_color: '#000000',
                    user_bubble_text_color: '#FFFFFF',
                },
                tools: [],
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
