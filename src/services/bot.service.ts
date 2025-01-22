import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { Bot, Message, Prisma, PrismaClient } from '@prisma/client';
import axios from 'axios';
import { createQueryFromMessages, getContentFromPage } from './openai.service.ts';
import { SimilarityResult, VectorDBService } from './vector_db.service.ts';

const prisma = new PrismaClient();

export interface HandleMessageResponse {
    content: string | object;
}

export interface BotSettings {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop_sequences?: string[];
}

export interface BotWidgetSettings {
    name?: string;
    show_header?: boolean;
    background_color?: string;
    text_color?: string;
    bot_bubble_color?: string;
    bot_bubble_text_color?: string;
    user_bubble_color?: string;
    user_bubble_text_color?: string;
    bot_picture?: string;
    initial_message?: string;
    suggested_messages?: string[];
    suggested_messages_always_displayed?: boolean;
}

export interface CreateBotDto {
    name: string;
    description?: string;
    model: string;
    prompt: string;
    prompt_template?: string;
    settings?: BotSettings;
}

export class BotService {
    /**
     * Handles a message sent to a bot, including context retrieval and response generation
     * @param botId The ID of the bot
     * @param content The message content
     * @param threadId The thread ID for the conversation
     * @returns The bot's response
     */
    async handleMessage(
        botId: string,
        content: string,
        threadId: string,
    ): Promise<HandleMessageResponse> {
        console.log('📩 Handling message:', botId, threadId, content);

        // Get bot configuration
        const bot = await this.getBotById(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        // Initialize chat model with bot settings
        const settings = bot.settings as BotSettings;
        // const tools = getHttpTools(bot.tools || []);

        let tools: any[] = [];
        // if (bot.tools) {
        //     tools = getHttpTools(bot.tools as any[]);
        // }

        const model = new ChatOpenAI({
            modelName: bot.model,
            openAIApiKey: process.env.OPENAI_API_KEY || '',
            temperature: settings?.temperature,
            maxTokens: settings?.max_tokens,
            topP: settings?.top_p,
            frequencyPenalty: settings?.frequency_penalty,
            presencePenalty: settings?.presence_penalty,
        }).bindTools(tools);

        // Store user message
        await this.createMessage(botId, 'user', content, threadId);
        // Get conversation history
        const history = await this.getBotMessages(botId, threadId);

        // Analyze conversation history to determine context
        const vectorDb = new VectorDBService();
        let queryContent = content;
        // If there's history, analyze for context
        if (history.length > 0) {
            queryContent = await createQueryFromMessages(
                history.map((msg) => ({ role: msg.role, content: msg.content })),
            );
        }

        // Query similar content from vector database with contextual query
        const similarContent = await vectorDb.querySimilar(botId, queryContent, 10, 0.25);

        // Create messages array with system prompt, tools info, and context
        let systemPrompt = bot.prompt;
        // Add tool descriptions and instructions
        // systemPrompt += '\n\nYou have access to the following tools:\n';

        // systemPrompt +=
        //     '\n\n2. HTTP Tool: Use this to get project information by providing a project ID.' +
        //     '\nExample: Get project info by calling it with the project ID';

        // systemPrompt +=
        //     '\n\nIMPORTANT INSTRUCTIONS FOR TOOL USE:' +
        //     '\n- When you receive tool results, incorporate them into your response naturally' +
        //     '\n- Format your response as a complete, natural sentence using the tool results';
        if (similarContent.length > 0) {
            console.log('✚  RAG pieces amount:', similarContent.length);
            systemPrompt +=
                "\n\nUse the following pieces of context to answer the question. If you don't know the answer, just say that you don't know, don't try to make up an answer.:\n----------------\n" +
                similarContent
                    .map(
                        (item: SimilarityResult) =>
                            `${item.content}\n(Source: ${item.metadata?.source || 'unknown'})`,
                    )
                    .join('\n\n');
        }
        const messages = [new SystemMessage(systemPrompt)];

        // Add conversation history
        for (const msg of history) {
            if (msg.role === 'user') {
                messages.push(new HumanMessage(msg.content));
            } else if (msg.role === 'assistant') {
                messages.push(new AIMessage(msg.content));
            }
        }

        // Add current user message
        messages.push(new HumanMessage(content));

        // Get response from the model
        const response = await model.invoke(messages);
        // console.log('Response:', response);

        // Execute any tool calls
        const toolCalls = response.additional_kwargs?.tool_calls || [];
        const toolOutputs = new Map<string, string>();

        if (toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
                try {
                    const args = JSON.parse(toolCall.function.arguments);
                    let result: string;

                    if (toolCall.function.name.includes('http_tool')) {
                        const httpTool = tools.find((t) => t.name === 'http_tool');
                        result = await httpTool.invoke(args);
                    } else {
                        throw new Error(`Unknown tool: ${toolCall.function.name}`);
                    }
                    console.log(`Tool ${toolCall.function.name} result:`, result);
                    if (toolCall.id) {
                        toolOutputs.set(toolCall.id, result);
                    }
                } catch (error) {
                    console.error(`Tool execution error:`, error);
                    if (toolCall.id) {
                        toolOutputs.set(
                            toolCall.id,
                            `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        );
                    }
                }
            }

            // Pass tool outputs back to the model
            // console.log('Tool outputs:', toolOutputs);

            // Create a system message with tool results and instructions
            const toolResults = Array.from(toolOutputs.entries())
                .map(([toolId, result]) => {
                    const toolCall = toolCalls.find((tc) => tc.id === toolId);
                    return toolCall ? `${toolCall.function.name} returned: ${result}` : '';
                })
                .filter(Boolean)
                .join('\n');

            messages.push(
                new SystemMessage(
                    `I have executed the tools and here are the results:\n${toolResults}\n\nPlease provide a natural language response using these results. Do not make any new tool calls.`,
                ),
            );

            // Get final response with tools disabled
            const finalResponse = await model.invoke(messages);
            const responseContent =
                typeof finalResponse.content === 'string'
                    ? finalResponse.content
                    : JSON.stringify(finalResponse.content);
            await this.createMessage(botId, 'assistant', responseContent, threadId);
            return { content: finalResponse.content };
        }

        // If no tool calls, return the original response
        const responseContent =
            typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
        await this.createMessage(botId, 'assistant', responseContent, threadId);
        console.log('📤 Response:', response.content);

        return { content: response.content };
    }

    /**
     * Stores a message in the database
     * @param botId The ID of the bot
     * @param role The role of the message sender (system, user, or assistant)
     * @param content The content of the message
     * @returns The created message
     */
    async createMessage(
        botId: string,
        role: string,
        content: string,
        threadId: string,
    ): Promise<Message> {
        try {
            const message = await prisma.message.create({
                data: {
                    bot_id: botId,
                    role,
                    content,
                    thread_id: threadId,
                },
            });
            return message;
        } catch (error) {
            throw new Error(
                `Failed to create message: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Retrieves the conversation history for a bot
     * @param botId The ID of the bot
     * @param limit Optional limit on number of messages to retrieve
     * @returns Array of messages in chronological order
     */
    async getBotMessages(botId: string, threadId?: string, limit?: number): Promise<Message[]> {
        try {
            const messages = await prisma.message.findMany({
                where: {
                    bot_id: botId,
                    ...(threadId ? { thread_id: threadId } : {}),
                },
                orderBy: { created_at: 'asc' },
                ...(limit ? { take: limit } : {}),
            });
            return messages;
        } catch (error) {
            throw new Error(
                `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Creates a new bot in the database
     * @param data Bot creation data
     * @returns The created bot
     */
    async createBot(data: CreateBotDto): Promise<Bot> {
        try {
            const bot = await prisma.bot.create({
                data: {
                    ...data,
                    settings: (data.settings || {}) as Prisma.InputJsonValue,
                },
            });
            return bot;
        } catch (error) {
            throw new Error(
                `Failed to create bot: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Retrieves all bots from the database
     * @returns Array of all bots
     */
    async getAllBots(): Promise<Bot[]> {
        try {
            const bots = await prisma.bot.findMany({
                orderBy: {
                    created_at: 'desc',
                },
            });
            return bots;
        } catch (error) {
            throw new Error(
                `Failed to fetch bots: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Retrieves a bot by its ID
     * @param id The bot ID
     * @returns The bot if found, null otherwise
     */
    async getBotById(id: string): Promise<Bot | null> {
        try {
            const bot = await prisma.bot.findUnique({
                where: { id },
            });
            return bot;
        } catch (error) {
            throw new Error(
                `Failed to fetch bot: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Updates a bot by its ID
     * @param id The bot ID
     * @param data The data to update
     * @returns The updated bot
     */
    async updateBotById(id: string, data: Partial<CreateBotDto>): Promise<Bot> {
        try {
            const bot = await prisma.bot.update({
                where: { id },
                data: {
                    ...data,
                    settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
                },
            });
            return bot;
        } catch (error) {
            throw new Error(
                `Failed to update bot: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    async getBotSettings(botId: string): Promise<BotWidgetSettings> {
        const bot = await this.getBotById(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }
        // Initialize chat model with bot settings
        const widgetSettings = bot.widget_settings as BotWidgetSettings;
        return widgetSettings;
    }

    async getThreadMessages(botId: string, threadId: string): Promise<Message[]> {
        return this.getBotMessages(botId, threadId);
    }
}

export const botService = new BotService();

export async function populateKBFromCrawlerResults(
    botId: string,
    startUrl: string,
): Promise<{ count: number }> {
    const bot = await botService.getBotById(botId);
    if (!bot) {
        throw new Error(`Bot not found: ${botId}`);
    }
    const vectorDB = new VectorDBService();

    let url = startUrl;
    let totalProcessed = 0;
    const items = [];
    const titles = [];

    while (url) {
        console.log(`[🔍] Fetching: ${url}`);
        const response = (await axios.get(url)).data;
        const results = response.data;

        let i = 0;
        const len = results.length;
        for (const result of results) {
            i++;
            totalProcessed++;
            console.log(`➡️ ${totalProcessed} (${i}/${len}) ${result.title}`);
            const content = await getContentFromPage(result.body);
            console.log(content);
            titles.push(result.title);
            items.push({
                content: `${result.title}\n${content}`,
                metadata: {
                    source: result.url,
                },
            });
        }

        url = response.next_page_url;
        if (url) {
            console.log(`⏭️ Next page URL: ${url}`);
        } else {
            console.log('⏹️ No more pages to process');
        }
    }

    const result = await vectorDB.batchStoreEmbeddings(botId, items, 'crawler');
    console.log(`💽 Stored ${result.count} embeddings (processed ${totalProcessed} items)`);

    // Update bot prompt template
    if (bot.prompt_template) {
        const updatedPrompt = bot.prompt_template
            .replace('{{titles}}', titles.join(', '))
            .replace('{{count}}', result.count.toString());
        await botService.updateBotById(botId, { prompt: updatedPrompt });
        console.log(`🔄 Updated bot prompt template`);
    }

    return { count: result.count || 0 };
}
