import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app.ts';
import { botService } from '../../services/bot.service.ts';

// Mock bot service
jest.mock('../../services/bot.service.ts', () => ({
    botService: {
        handleMessage: jest.fn(),
        getAllBots: jest.fn(),
        createBot: jest.fn(),
    },
}));

let app: Express;

beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
});

describe('API Integration Tests', () => {
    describe('GET /', () => {
        it('should return 200 and correct message', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'DHH API' });
        });

        it('should return 404 for non-existent route', async () => {
            const response = await request(app).get('/non-existent');
            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/bots/:botId/messages', () => {
        const validBotId = 'test-bot-id';
        const validMessage = {
            content: 'Hello, bot!',
            thread_id: 'thread-123',
        };

        beforeEach(() => {
            (botService.handleMessage as jest.Mock).mockReset();
        });

        it('should handle valid message request successfully', async () => {
            const mockResponse = {
                content: 'Bot response',
            };
            (botService.handleMessage as jest.Mock).mockResolvedValue(mockResponse);

            const response = await request(app)
                .post(`/api/bots/${validBotId}/messages`)
                .send(validMessage);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                message: mockResponse.content,
            });
            expect(botService.handleMessage).toHaveBeenCalledWith(
                validBotId,
                validMessage.content,
                validMessage.thread_id,
            );
        });

        it('should return 400 for missing content', async () => {
            const response = await request(app)
                .post(`/api/bots/${validBotId}/messages`)
                .send({
                    ...validMessage,
                    content: '',
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid request body',
                }),
            );
        });

        it('should return 400 for missing thread_id', async () => {
            const response = await request(app)
                .post(`/api/bots/${validBotId}/messages`)
                .send({
                    ...validMessage,
                    thread_id: '',
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid request body',
                }),
            );
        });

        it('should return 404 when bot is not found', async () => {
            (botService.handleMessage as jest.Mock).mockRejectedValue(new Error('Bot not found'));

            const response = await request(app)
                .post(`/api/bots/${validBotId}/messages`)
                .send(validMessage);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                success: false,
                error: 'Bot not found',
            });
        });

        it('should return 500 for unexpected errors', async () => {
            (botService.handleMessage as jest.Mock).mockRejectedValue(
                new Error('Unexpected error'),
            );

            const response = await request(app)
                .post(`/api/bots/${validBotId}/messages`)
                .send(validMessage);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                success: false,
                error: 'Internal server error',
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle JSON parsing errors', async () => {
            const response = await request(app)
                .post(`/api/bots/test-id/messages`)
                .set('Content-Type', 'application/json')
                .send('invalid json{');

            expect(response.status).toBe(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    error: expect.any(String),
                }),
            );
        });

        it('should handle unsupported media type', async () => {
            const response = await request(app)
                .post(`/api/bots/test-id/messages`)
                .set('Content-Type', 'text/plain')
                .send('Hello');

            expect(response.status).toBe(415);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    error: expect.any(String),
                }),
            );
        });
    });
});
