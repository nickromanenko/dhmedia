import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { VectorDBService } from '../../services/vector_db.service.ts';

// Mock OpenAI
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        embeddings: {
            create: jest.fn(),
        },
    }));
});

// Mock PrismaClient
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
        })),
        Prisma: {
            sql: jest.fn((strings: TemplateStringsArray, ...values: any[]) => ({
                strings,
                values,
            })),
            raw: jest.fn((value: string) => value),
        },
    };
});

describe('VectorDBService', () => {
    let vectorDBService: VectorDBService;
    let mockPrisma: jest.Mocked<PrismaClient>;
    let mockOpenAI: jest.Mocked<OpenAI>;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.OPENAI_API_KEY = 'test-key';
        vectorDBService = new VectorDBService();
        mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
        mockOpenAI = new OpenAI() as jest.Mocked<OpenAI>;
    });

    describe('storeEmbedding', () => {
        const mockEmbedding = Array(1536).fill(0.1);
        const mockContent = 'Test content';
        const mockBotId = 'test-bot-id';
        const mockMetadata = { source: 'test' };

        beforeEach(() => {
            (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValue({
                data: [{ embedding: mockEmbedding }],
            });
            mockPrisma.$queryRaw.mockResolvedValue([
                {
                    id: 'test-id',
                    content: mockContent,
                    embedding: mockEmbedding,
                    metadata: mockMetadata,
                    bot_id: mockBotId,
                    created_at: new Date(),
                },
            ]);
        });

        it('should store embedding successfully', async () => {
            const result = await vectorDBService.storeEmbedding(
                mockContent,
                mockBotId,
                mockMetadata,
            );

            expect(result).toBeDefined();
            expect(result.content).toBe(mockContent);
            expect(result.bot_id).toBe(mockBotId);
            expect(result.metadata).toEqual(mockMetadata);
            expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
                input: mockContent,
                model: 'text-embedding-3-small',
            });
        });

        it('should handle errors from OpenAI', async () => {
            const error = new Error('OpenAI API error');
            (mockOpenAI.embeddings.create as jest.Mock).mockRejectedValue(error);

            await expect(vectorDBService.storeEmbedding(mockContent, mockBotId)).rejects.toThrow(
                'OpenAI API error',
            );
        });
    });

    describe('querySimilar', () => {
        const mockEmbedding = Array(1536).fill(0.1);
        const mockQuery = 'test query';
        const mockBotId = 'test-bot-id';
        const mockResults = [
            {
                id: 'test-id-1',
                content: 'Similar content 1',
                metadata: { source: 'test1' },
                similarity: 0.8,
            },
            {
                id: 'test-id-2',
                content: 'Similar content 2',
                metadata: { source: 'test2' },
                similarity: 0.6,
            },
        ];

        beforeEach(() => {
            (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValue({
                data: [{ embedding: mockEmbedding }],
            });
            mockPrisma.$queryRaw.mockResolvedValue(mockResults);
        });

        it('should query similar content successfully', async () => {
            const result = await vectorDBService.querySimilar(mockQuery, mockBotId);

            expect(result).toEqual(mockResults);
            expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
                input: mockQuery,
                model: 'text-embedding-3-small',
            });
        });

        it('should respect limit parameter', async () => {
            await vectorDBService.querySimilar(mockQuery, mockBotId, 1);

            expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.arrayContaining([1]),
                }),
            );
        });

        it('should respect similarity threshold', async () => {
            await vectorDBService.querySimilar(mockQuery, mockBotId, 5, 0.7);

            expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
                expect.objectContaining({
                    values: expect.arrayContaining([0.7]),
                }),
            );
        });
    });

    describe('batchStoreEmbeddings', () => {
        const mockEmbedding = Array(1536).fill(0.1);
        const mockItems = [
            { content: 'Test 1', metadata: { source: 'test1' } },
            { content: 'Test 2', metadata: { source: 'test2' } },
        ];
        const mockBotId = 'test-bot-id';

        beforeEach(() => {
            (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValue({
                data: [{ embedding: mockEmbedding }],
            });
            mockPrisma.$executeRaw.mockResolvedValue(2);
        });

        it('should batch store embeddings successfully', async () => {
            const result = await vectorDBService.batchStoreEmbeddings(mockItems, mockBotId);

            expect(result.count).toBe(2);
            expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2);
        });

        it('should handle empty items array', async () => {
            const result = await vectorDBService.batchStoreEmbeddings([], mockBotId);

            expect(result.count).toBe(0);
            expect(mockOpenAI.embeddings.create).not.toHaveBeenCalled();
        });
    });

    describe('deleteEmbeddings', () => {
        const mockIds = ['id1', 'id2'];

        beforeEach(() => {
            mockPrisma.$executeRaw.mockResolvedValue(2);
        });

        it('should delete embeddings successfully', async () => {
            const result = await vectorDBService.deleteEmbeddings(mockIds);

            expect(result.count).toBe(2);
            expect(mockPrisma.$executeRaw).toHaveBeenCalled();
        });

        it('should handle empty ids array', async () => {
            const result = await vectorDBService.deleteEmbeddings([]);

            expect(result.count).toBe(0);
            expect(mockPrisma.$executeRaw).toHaveBeenCalled();
        });
    });

    describe('updateEmbeddingMetadata', () => {
        const mockId = 'test-id';
        const mockMetadata = { source: 'updated' };
        const mockEmbedding = {
            id: mockId,
            content: 'Test content',
            embedding: Array(1536).fill(0.1),
            metadata: mockMetadata,
            bot_id: 'test-bot-id',
            created_at: new Date(),
        };

        beforeEach(() => {
            mockPrisma.$queryRaw.mockResolvedValue([mockEmbedding]);
        });

        it('should update metadata successfully', async () => {
            const result = await vectorDBService.updateEmbeddingMetadata(mockId, mockMetadata);

            expect(result).toEqual(mockEmbedding);
            expect(mockPrisma.$queryRaw).toHaveBeenCalled();
        });

        it('should throw error for non-existent embedding', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([]);

            await expect(
                vectorDBService.updateEmbeddingMetadata(mockId, mockMetadata),
            ).rejects.toThrow(`No embedding found with id ${mockId}`);
        });
    });
});
