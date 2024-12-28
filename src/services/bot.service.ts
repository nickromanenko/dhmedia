import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { Bot, Message, Prisma, PrismaClient } from '@prisma/client';
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

export interface CreateBotDto {
    name: string;
    description?: string;
    model: string;
    api_key: string;
    prompt: string;
    kb_id?: string;
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
        // Get bot configuration
        const bot = await this.getBotById(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        // Initialize chat model with bot settings
        const settings = bot.settings as BotSettings;
        const chat = new ChatOpenAI({
            modelName: bot.model,
            openAIApiKey: bot.api_key,
            temperature: settings?.temperature,
            maxTokens: settings?.max_tokens,
            topP: settings?.top_p,
            frequencyPenalty: settings?.frequency_penalty,
            presencePenalty: settings?.presence_penalty,
        });

        // Get conversation history
        const history = await this.getBotMessages(botId, threadId);

        // Query similar content from vector database
        const vectorDb = new VectorDBService();
        const similarContent = await vectorDb.querySimilar(content, botId);

        // Create messages array with system prompt and context
        let systemPrompt = bot.prompt;
        if (similarContent.length > 0) {
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

        // Store user message
        await this.createMessage(botId, 'user', content, threadId);

        // Get response from the model
        const response = await chat.invoke(messages);

        // Store assistant response
        const responseContent =
            typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
        await this.createMessage(botId, 'assistant', responseContent, threadId);

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
}

// Export a singleton instance
export const botService = new BotService();
