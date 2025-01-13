import { ChatOpenAI } from '@langchain/openai';
import { Bot, Message, PrismaClient } from '@prisma/client';
import { BotService, CreateBotDto } from '../../services/bot.service.ts';
import { VectorDBService } from '../../services/vector_db.service.ts';

// Mock ChatOpenAI
jest.mock('@langchain/openai', () => ({
    ChatOpenAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn(),
    })),
}));

// Mock VectorDBService
jest.mock('../../services/vector_db.service.ts', () => ({
    VectorDBService: jest.fn().mockImplementation(() => ({
        querySimilar: jest.fn(),
    })),
}));

// Extend PrismaClient type to include Jest mock methods
type MockPrismaClient = {
    bot: {
        create: jest.Mock;
        findMany: jest.Mock;
        findUnique: jest.Mock;
    };
    message: {
        create: jest.Mock;
        findMany: jest.Mock;
    };
};

// Mock PrismaClient
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            bot: {
                create: jest.fn(),
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
            message: {
                create: jest.fn(),
                findMany: jest.fn(),
            },
        })),
    };
});

describe('BotService', () => {
    let botService: BotService;
    let prismaClient: MockPrismaClient;
    let mockChatOpenAI: jest.Mocked<ChatOpenAI>;
    let mockVectorDBService: jest.Mocked<VectorDBService>;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        botService = new BotService();
        prismaClient = new PrismaClient() as unknown as MockPrismaClient;
        mockChatOpenAI = new ChatOpenAI() as jest.Mocked<ChatOpenAI>;
        mockVectorDBService = new VectorDBService() as jest.Mocked<VectorDBService>;
    });

    describe('handleMessage', () => {
        const mockBot: Bot = {
            id: 'test-bot',
            name: 'Test Bot',
            description: null,
            model: 'gpt-4',
            api_key: 'test-key',
            prompt: 'You are a test bot',
            settings: { temperature: 0.7 },
            widget_settings: {},
            created_at: new Date(),
            updated_at: new Date(),
        };

        const mockMessages: Message[] = [
            {
                id: '1',
                bot_id: 'test-bot',
                role: 'user',
                content: 'Hello',
                thread_id: 'thread-1',
                created_at: new Date(),
            },
            {
                id: '2',
                bot_id: 'test-bot',
                role: 'assistant',
                content: 'Hi there!',
                thread_id: 'thread-1',
                created_at: new Date(),
            },
        ];

        beforeEach(() => {
            prismaClient.bot.findUnique.mockResolvedValue(mockBot);
            prismaClient.message.findMany.mockResolvedValue(mockMessages);
            mockVectorDBService.querySimilar.mockResolvedValue([]);
            (mockChatOpenAI.invoke as jest.Mock).mockResolvedValue({ content: 'Test response' });
        });

        it('should handle message successfully', async () => {
            const response = await botService.handleMessage('test-bot', 'Hello', 'thread-1');

            expect(response).toEqual({ content: 'Test response' });
            expect(prismaClient.message.create).toHaveBeenCalledTimes(2); // User message and bot response
        });

        it('should throw error when bot is not found', async () => {
            prismaClient.bot.findUnique.mockResolvedValue(null);

            await expect(
                botService.handleMessage('invalid-bot', 'Hello', 'thread-1'),
            ).rejects.toThrow('Bot not found');
        });

        it('should include similar content in system prompt when available', async () => {
            mockVectorDBService.querySimilar.mockResolvedValue([
                {
                    id: 'similar-1',
                    content: 'Similar content',
                    metadata: { source: 'test' },
                    similarity: 0.9,
                },
            ]);

            await botService.handleMessage('test-bot', 'Hello', 'thread-1');

            expect(mockChatOpenAI.invoke).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        content: expect.stringContaining('Similar content'),
                    }),
                ]),
            );
        });
    });

    describe('createMessage', () => {
        const mockMessage: Message = {
            id: 'msg-1',
            bot_id: 'test-bot',
            role: 'user',
            content: 'Test message',
            thread_id: 'thread-1',
            created_at: new Date(),
        };

        it('should create message successfully', async () => {
            prismaClient.message.create.mockResolvedValue(mockMessage);

            const result = await botService.createMessage(
                'test-bot',
                'user',
                'Test message',
                'thread-1',
            );

            expect(result).toEqual(mockMessage);
            expect(prismaClient.message.create).toHaveBeenCalledWith({
                data: {
                    bot_id: 'test-bot',
                    role: 'user',
                    content: 'Test message',
                    thread_id: 'thread-1',
                },
            });
        });

        it('should throw error when message creation fails', async () => {
            prismaClient.message.create.mockRejectedValue(new Error('Database error'));

            await expect(
                botService.createMessage('test-bot', 'user', 'Test message', 'thread-1'),
            ).rejects.toThrow('Failed to create message: Database error');
        });
    });

    describe('getBotMessages', () => {
        const mockMessages: Message[] = [
            {
                id: '1',
                bot_id: 'test-bot',
                role: 'user',
                content: 'Hello',
                thread_id: 'thread-1',
                created_at: new Date(),
            },
            {
                id: '2',
                bot_id: 'test-bot',
                role: 'assistant',
                content: 'Hi there!',
                thread_id: 'thread-1',
                created_at: new Date(),
            },
        ];

        it('should return messages for a bot', async () => {
            prismaClient.message.findMany.mockResolvedValue(mockMessages);

            const result = await botService.getBotMessages('test-bot');

            expect(result).toEqual(mockMessages);
            expect(prismaClient.message.findMany).toHaveBeenCalledWith({
                where: { bot_id: 'test-bot' },
                orderBy: { created_at: 'asc' },
            });
        });

        it('should return messages for a specific thread', async () => {
            prismaClient.message.findMany.mockResolvedValue(mockMessages);

            const result = await botService.getBotMessages('test-bot', 'thread-1');

            expect(result).toEqual(mockMessages);
            expect(prismaClient.message.findMany).toHaveBeenCalledWith({
                where: { bot_id: 'test-bot', thread_id: 'thread-1' },
                orderBy: { created_at: 'asc' },
            });
        });

        it('should respect limit parameter', async () => {
            prismaClient.message.findMany.mockResolvedValue([mockMessages[0]]);

            const result = await botService.getBotMessages('test-bot', undefined, 1);

            expect(result).toEqual([mockMessages[0]]);
            expect(prismaClient.message.findMany).toHaveBeenCalledWith({
                where: { bot_id: 'test-bot' },
                orderBy: { created_at: 'asc' },
                take: 1,
            });
        });
    });

    describe('getBotById', () => {
        const mockBot: Bot = {
            id: 'test-bot',
            name: 'Test Bot',
            description: null,
            model: 'gpt-4',
            api_key: 'test-key',
            prompt: 'You are a test bot',
            settings: {},
            widget_settings: {},
            created_at: new Date(),
            updated_at: new Date(),
        };

        it('should return bot when found', async () => {
            prismaClient.bot.findUnique.mockResolvedValue(mockBot);

            const result = await botService.getBotById('test-bot');

            expect(result).toEqual(mockBot);
            expect(prismaClient.bot.findUnique).toHaveBeenCalledWith({
                where: { id: 'test-bot' },
            });
        });

        it('should return null when bot is not found', async () => {
            prismaClient.bot.findUnique.mockResolvedValue(null);

            const result = await botService.getBotById('non-existent');

            expect(result).toBeNull();
        });

        it('should throw error when database query fails', async () => {
            prismaClient.bot.findUnique.mockRejectedValue(new Error('Database error'));

            await expect(botService.getBotById('test-bot')).rejects.toThrow(
                'Failed to fetch bot: Database error',
            );
        });
    });

    describe('getBotSettings', () => {
        const mockBot: Bot = {
            id: 'test-bot',
            name: 'Test Bot',
            description: null,
            model: 'gpt-4',
            api_key: 'test-key',
            prompt: 'You are a test bot',
            settings: {},
            widget_settings: {
                name: 'Widget Bot',
                show_header: true,
                background_color: '#ffffff',
            },
            created_at: new Date(),
            updated_at: new Date(),
        };

        it('should return widget settings when bot exists', async () => {
            prismaClient.bot.findUnique.mockResolvedValue(mockBot);

            const result = await botService.getBotSettings('test-bot');

            expect(result).toEqual(mockBot.widget_settings);
        });

        it('should throw error when bot is not found', async () => {
            prismaClient.bot.findUnique.mockResolvedValue(null);

            await expect(botService.getBotSettings('non-existent')).rejects.toThrow(
                'Bot not found',
            );
        });
    });

    describe('getThreadMessages', () => {
        it('should call getBotMessages with thread ID', async () => {
            const mockMessages: Message[] = [
                {
                    id: '1',
                    bot_id: 'test-bot',
                    role: 'user',
                    content: 'Hello',
                    thread_id: 'thread-1',
                    created_at: new Date(),
                },
            ];

            prismaClient.message.findMany.mockResolvedValue(mockMessages);

            const result = await botService.getThreadMessages('test-bot', 'thread-1');

            expect(result).toEqual(mockMessages);
            expect(prismaClient.message.findMany).toHaveBeenCalledWith({
                where: { bot_id: 'test-bot', thread_id: 'thread-1' },
                orderBy: { created_at: 'asc' },
            });
        });
    });

    describe('createBot', () => {
        const mockBotData: CreateBotDto = {
            name: 'Test Bot',
            model: 'gpt-4',
            api_key: 'test-key',
            prompt: 'You are a test bot',
        };

        const mockCreatedBot: Bot = {
            id: '1',
            name: 'Test Bot',
            description: null,
            model: 'gpt-4',
            api_key: 'test-key',
            prompt: 'You are a test bot',
            settings: {},
            widget_settings: {},
            created_at: new Date(),
            updated_at: new Date(),
        };

        it('should create a bot successfully', async () => {
            prismaClient.bot.create.mockResolvedValue(mockCreatedBot);

            const result = await botService.createBot(mockBotData);

            expect(result).toEqual(mockCreatedBot);
            expect(prismaClient.bot.create).toHaveBeenCalledWith({
                data: {
                    ...mockBotData,
                    settings: {},
                },
            });
        });

        it('should create a bot with settings', async () => {
            const botDataWithSettings: CreateBotDto = {
                ...mockBotData,
                settings: {
                    temperature: 0.7,
                    max_tokens: 100,
                },
            };

            prismaClient.bot.create.mockResolvedValue({
                ...mockCreatedBot,
                settings: botDataWithSettings.settings,
            });

            const result = await botService.createBot(botDataWithSettings);

            expect(result.settings).toEqual(botDataWithSettings.settings);
            expect(prismaClient.bot.create).toHaveBeenCalledWith({
                data: botDataWithSettings,
            });
        });

        it('should throw an error if bot creation fails', async () => {
            const error = new Error('Database error');
            prismaClient.bot.create.mockRejectedValue(error);

            await expect(botService.createBot(mockBotData)).rejects.toThrow(
                'Failed to create bot: Database error',
            );
        });
    });

    describe('getAllBots', () => {
        const mockBots: Bot[] = [
            {
                id: '1',
                name: 'Bot 1',
                description: null,
                model: 'gpt-4',
                api_key: 'key-1',
                prompt: 'Prompt 1',
                settings: {},
                widget_settings: {},
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: '2',
                name: 'Bot 2',
                description: 'Description 2',
                model: 'gpt-3.5',
                api_key: 'key-2',
                prompt: 'Prompt 2',
                settings: { temperature: 0.7 },
                widget_settings: {},
                created_at: new Date(),
                updated_at: new Date(),
            },
        ];

        it('should return all bots successfully', async () => {
            prismaClient.bot.findMany.mockResolvedValue(mockBots);

            const result = await botService.getAllBots();

            expect(result).toEqual(mockBots);
            expect(prismaClient.bot.findMany).toHaveBeenCalledWith({
                orderBy: {
                    created_at: 'desc',
                },
            });
        });

        it('should return empty array when no bots exist', async () => {
            prismaClient.bot.findMany.mockResolvedValue([]);

            const result = await botService.getAllBots();

            expect(result).toEqual([]);
            expect(prismaClient.bot.findMany).toHaveBeenCalled();
        });

        it('should throw an error if fetching bots fails', async () => {
            const error = new Error('Database error');
            prismaClient.bot.findMany.mockRejectedValue(error);

            await expect(botService.getAllBots()).rejects.toThrow(
                'Failed to fetch bots: Database error',
            );
        });
    });
});
