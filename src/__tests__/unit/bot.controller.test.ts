import { Request, Response } from 'express';
import { handleMessage } from '../../controllers/bot.controller.ts';
import { botService } from '../../services/bot.service.ts';

// Mock bot service
jest.mock('../../services/bot.service.ts', () => ({
    botService: {
        handleMessage: jest.fn(),
    },
}));

describe('Bot Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    const mockJson = jest.fn();
    const mockStatus = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockJson.mockClear();
        mockStatus.mockClear();

        mockResponse = {
            json: mockJson,
            status: mockStatus.mockReturnThis(),
        };

        mockRequest = {
            params: {},
            body: {},
        };

        // Reset mock implementations
        (botService.handleMessage as jest.Mock).mockReset();
    });

    describe('handleMessage', () => {
        const validBotId = 'valid-bot-id';
        const validContent = 'Hello, bot!';
        const validThreadId = 'thread-123';

        it('should handle valid message request successfully', async () => {
            mockRequest.params = { botId: validBotId };
            mockRequest.body = {
                content: validContent,
                thread_id: validThreadId,
            };

            const mockServiceResponse = {
                content: 'Bot response',
            };

            (botService.handleMessage as jest.Mock).mockResolvedValue(mockServiceResponse);

            await handleMessage(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                message: mockServiceResponse.content,
            });
            expect(botService.handleMessage).toHaveBeenCalledWith(
                validBotId,
                validContent,
                validThreadId,
            );
        });

        it('should return 400 for invalid bot ID', async () => {
            mockRequest.params = { botId: '' };
            mockRequest.body = {
                content: validContent,
                thread_id: validThreadId,
            };

            await handleMessage(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid bot ID',
                }),
            );
        });

        it('should return 400 for missing content', async () => {
            mockRequest.params = { botId: validBotId };
            mockRequest.body = {
                content: '',
                thread_id: validThreadId,
            };

            await handleMessage(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid request body',
                }),
            );
        });

        it('should return 400 for missing thread_id', async () => {
            mockRequest.params = { botId: validBotId };
            mockRequest.body = {
                content: validContent,
                thread_id: '',
            };

            await handleMessage(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: 'Invalid request body',
                }),
            );
        });

        it('should return 404 when bot is not found', async () => {
            mockRequest.params = { botId: validBotId };
            mockRequest.body = {
                content: validContent,
                thread_id: validThreadId,
            };

            (botService.handleMessage as jest.Mock).mockRejectedValue(new Error('Bot not found'));

            await handleMessage(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Bot not found',
            });
        });

        it('should return 500 for unexpected errors', async () => {
            mockRequest.params = { botId: validBotId };
            mockRequest.body = {
                content: validContent,
                thread_id: validThreadId,
            };

            (botService.handleMessage as jest.Mock).mockRejectedValue(
                new Error('Unexpected error'),
            );

            await handleMessage(mockRequest as Request, mockResponse as Response);

            expect(mockStatus).toHaveBeenCalledWith(500);
            expect(mockJson).toHaveBeenCalledWith({
                success: false,
                error: 'Internal server error',
            });
        });
    });
});
