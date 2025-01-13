import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function getContentFromPage(htmlContent: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
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
        max_tokens: 4000,
    });

    return response.choices[0].message.content || '';
}
