import OpenAI from 'openai';

export async function getContentFromPage(htmlContent: string): Promise<string> {
    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content:
                    'You are a content extractor. Extract the main content, key information, and important details from the provided HTML. Ignore navigation menus, footers, ads. Return the content in a clear, readable format. Do not explain the content, just extract it.',
            },
            {
                role: 'user',
                content: htmlContent,
            },
        ],
        temperature: 0.3,
        max_tokens: 10000,
    });

    return response.choices[0].message.content || '';
}

export async function createQueryFromMessages(
    messages: Array<{ role: string; content: string }>,
): Promise<string> {
    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `You are a query generator for a vector database search system. Your task is to analyze the conversation and generate a focused search query that will help find relevant information from a knowledge base.

Instructions:
1. Analyze the conversation context, focusing on the user's latest questions and needs
2. Extract key concepts, terms, and phrases that represent the core information need
3. Create a clear, concise search query that captures the essential search intent
4. Focus on factual and specific terms rather than conversational elements
5. Exclude generic pleasantries, greetings, or meta-conversation
6. If the conversation has multiple topics, prioritize the most recent relevant topic
7. The query should be 1 sentence maximum, focused on the key search terms - ideally several words

Do not explain your process or add any commentary. Return only the search query.`,
            },
            {
                role: 'user',
                content: `Please analyze this conversation and create a search query:\n\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
            },
        ],
        temperature: 0.3,
        max_tokens: 4000,
    });

    return response.choices[0].message.content || '';
}
