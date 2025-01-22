import { Prisma, PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import OpenAI from 'openai';

export type EmbeddingRecord = {
    id: string;
    content: string;
    embedding: any;
    metadata: Record<string, any>;
    bot_id: string;
    created_at: Date;
};

export type SimilarityResult = {
    id: string;
    content: string;
    metadata: Record<string, any>;
    similarity: number;
};

export class VectorDBService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Creates an embedding for the given text using OpenAI's API
     */
    private async createEmbedding(text: string): Promise<number[]> {
        const openai: OpenAI = new OpenAI();
        const response = await openai.embeddings.create({
            input: text,
            model: 'text-embedding-3-small',
        });

        return response.data[0].embedding;
    }

    /**
     * Stores text content and its embedding vector in the database
     */
    async storeEmbedding(
        apiKey: string,
        content: string,
        botId: string,
        metadata?: Record<string, any>,
    ): Promise<EmbeddingRecord> {
        const embedding = await this.createEmbedding(apiKey, content);
        const id = crypto.randomUUID();

        const result = await this.prisma.$queryRaw<EmbeddingRecord[]>(
            Prisma.sql`
                INSERT INTO embeddings (id, content, embedding, metadata, bot_id, created_at)
                VALUES (
                    ${id},
                    ${content},
                    ${Prisma.raw(`array[${embedding.join(',')}]::vector(1536)`)},
                    ${metadata || {}}::jsonb,
                    ${botId},
                    CURRENT_TIMESTAMP
                )
                RETURNING *;
            `,
        );

        return result[0];
    }

    /**
     * Queries the database for similar content using cosine similarity
     * @param text The text to find similar content for
     * @param botId The ID of the bot to query embeddings for
     * @param limit The maximum number of results to return
     * @param similarityThreshold The minimum similarity score (0-1) to include in results
     */
    async querySimilar(
        botId: string,
        text: string,
        limit: number = 5,
        similarityThreshold: number = 0.4,
    ): Promise<SimilarityResult[]> {
        console.log('👀 querySimilar', botId, text, limit, similarityThreshold);

        const queryEmbedding = await this.createEmbedding(text);
        const vectorQuery = `array[${queryEmbedding.join(',')}]::vector(1536)`;

        const results = await this.prisma.$queryRaw<SimilarityResult[]>(
            Prisma.sql`
                SELECT
                    id,
                    content,
                    metadata,
                    1 - (embedding <=> ${Prisma.raw(vectorQuery)}) as similarity
                FROM embeddings
                WHERE bot_id = ${botId}
                AND 1 - (embedding <=> ${Prisma.raw(vectorQuery)}) > ${similarityThreshold}
                ORDER BY similarity DESC
                LIMIT ${limit};
            `,
        );

        return results;
    }

    /**
     * Batch stores multiple text contents and their embeddings
     */
    async batchStoreEmbeddings(
        botId: string,
        items: Array<{ content: string; metadata?: Record<string, any> }>,
        tag: string = '',
    ): Promise<{ count: number }> {
        console.log('batchStoreEmbeddings', botId, items.length);
        const embeddings = await Promise.all(
            items.map(async (item) => {
                const embedding = await this.createEmbedding(item.content);
                return {
                    id: crypto.randomUUID(),
                    content: item.content,
                    embedding,
                    metadata: {
                        source: item.metadata?.source || 'unknown',
                        loc: item.metadata?.loc || 'unknown',
                    },
                    tag,
                };
            }),
        );

        const valuesSql = embeddings
            .map((e) => {
                const vectorStr = `array[${e.embedding.join(',')}]::vector(1536)`;
                return Prisma.sql`(
                    ${e.id},
                    ${e.content},
                    ${Prisma.raw(vectorStr)},
                    ${e.metadata}::jsonb,
                    ${botId},
                    CURRENT_TIMESTAMP
                )`;
            })
            .reduce((prev, curr) => Prisma.sql`${prev}, ${curr}`);

        await this.prisma.$executeRaw(
            Prisma.sql`
                INSERT INTO embeddings (id, content, embedding, metadata, bot_id, created_at)
                VALUES ${valuesSql};
            `,
        );

        return { count: embeddings.length };
    }

    /**
     * Deletes embeddings by their IDs
     */
    async deleteEmbeddings(ids: string[]): Promise<{ count: number }> {
        const result = await this.prisma.$executeRaw(
            Prisma.sql`
                DELETE FROM embeddings
                WHERE id = ANY(${Prisma.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(',')}]`)})
                RETURNING id;
            `,
        );
        return { count: typeof result === 'number' ? result : 0 };
    }

    /**
     * Updates the metadata of an embedding
     */
    async updateEmbeddingMetadata(
        id: string,
        metadata: Record<string, any>,
    ): Promise<EmbeddingRecord> {
        const result = await this.prisma.$queryRaw<EmbeddingRecord[]>(
            Prisma.sql`
                UPDATE embeddings
                SET metadata = ${metadata}::jsonb
                WHERE id = ${id}
                RETURNING *;
            `,
        );

        if (!result[0]) {
            throw new Error(`No embedding found with id ${id}`);
        }

        return result[0];
    }

    /**
     * Gets all embeddings for a specific bot
     * @param botId The ID of the bot to get embeddings for
     */
    async getAllEmbeddingsByBotId(botId: string): Promise<EmbeddingRecord[]> {
        const results = await this.prisma.$queryRaw<EmbeddingRecord[]>(
            Prisma.sql`
                SELECT id, content, metadata, bot_id, created_at
                FROM embeddings
                WHERE bot_id = ${botId}
                ORDER BY created_at DESC;
            `,
        );

        return results;
    }

    async deleteByBotId(botId: string): Promise<{ count: number }> {
        const result = await this.prisma.$executeRaw(
            Prisma.sql`
                DELETE FROM embeddings
                WHERE bot_id = ${botId}
                RETURNING id;
            `,
        );
        return { count: typeof result === 'number' ? result : 0 };
    }

    async deleteByBotIdAndMetadataSource(
        botId: string,
        source: string,
    ): Promise<{ count: number }> {
        const result = await this.prisma.$executeRaw(
            Prisma.sql`
                DELETE FROM embeddings
                WHERE bot_id = ${botId}
                AND metadata->>'source' LIKE ${`%${source}%`}
                RETURNING id;
            `,
        );
        return { count: typeof result === 'number' ? result : 0 };
    }
}
