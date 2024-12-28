import { Bot, PrismaClient } from '@prisma/client';
import { BotService, CreateBotDto } from '../../services/bot.service.ts';

// Extend PrismaClient type to include Jest mock methods
type MockPrismaClient = {
    bot: {
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
            },
        })),
    };
});

describe('BotService', () => {
    let botService: BotService;
    let prismaClient: MockPrismaClient;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        botService = new BotService();
        prismaClient = new PrismaClient() as unknown as MockPrismaClient;
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
            kb_id: null,
            settings: {},
            created_at: new Date(),
            updated_at: new Date(),
        };

        it('should create a bot successfully', async () => {
            // Setup mock
            prismaClient.bot.create.mockResolvedValue(mockCreatedBot);

            // Execute
            const result = await botService.createBot(mockBotData);

            // Assert
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

            // Setup mock
            prismaClient.bot.create.mockResolvedValue({
                ...mockCreatedBot,
                settings: botDataWithSettings.settings,
            });

            // Execute
            const result = await botService.createBot(botDataWithSettings);

            // Assert
            expect(result.settings).toEqual(botDataWithSettings.settings);
            expect(prismaClient.bot.create).toHaveBeenCalledWith({
                data: botDataWithSettings,
            });
        });

        it('should throw an error if bot creation fails', async () => {
            // Setup mock to throw error
            const error = new Error('Database error');
            prismaClient.bot.create.mockRejectedValue(error);

            // Execute and assert
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
                kb_id: null,
                settings: {},
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
                kb_id: 'kb-1',
                settings: { temperature: 0.7 },
                created_at: new Date(),
                updated_at: new Date(),
            },
        ];

        it('should return all bots successfully', async () => {
            // Setup mock
            prismaClient.bot.findMany.mockResolvedValue(mockBots);

            // Execute
            const result = await botService.getAllBots();

            // Assert
            expect(result).toEqual(mockBots);
            expect(prismaClient.bot.findMany).toHaveBeenCalledWith({
                orderBy: {
                    created_at: 'desc',
                },
            });
        });

        it('should return empty array when no bots exist', async () => {
            // Setup mock
            prismaClient.bot.findMany.mockResolvedValue([]);

            // Execute
            const result = await botService.getAllBots();

            // Assert
            expect(result).toEqual([]);
            expect(prismaClient.bot.findMany).toHaveBeenCalled();
        });

        it('should throw an error if fetching bots fails', async () => {
            // Setup mock to throw error
            const error = new Error('Database error');
            prismaClient.bot.findMany.mockRejectedValue(error);

            // Execute and assert
            await expect(botService.getAllBots()).rejects.toThrow(
                'Failed to fetch bots: Database error',
            );
        });
    });
});
