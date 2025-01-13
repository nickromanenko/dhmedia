import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { MessageRequestBodyDto, MessageRequestParamsDto } from '../dto/message.dto.ts';
import { botService } from '../services/bot.service.ts';

/**
 * @swagger
 * /{botId}/messages:
 *   post:
 *     summary: Send a message to a bot
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the bot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The message content
 *               thread_id:
 *                 type: string
 *                 description: The thread ID for the conversation
 *             required:
 *               - content
 *               - thread_id
 *     responses:
 *       200:
 *         description: Message processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Bot not found
 *       500:
 *         description: Internal server error
 */
export async function handleMessage(req: Request, res: Response): Promise<any> {
    // Validate URL parameters
    const paramsDto = plainToInstance(MessageRequestParamsDto, req.params);
    const paramsErrors = await validate(paramsDto);
    if (paramsErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid bot ID',
            details: paramsErrors,
        });
    }

    // Validate request body
    const bodyDto = plainToInstance(MessageRequestBodyDto, req.body);
    const bodyErrors = await validate(bodyDto);
    if (bodyErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request body',
            details: bodyErrors,
        });
    }

    try {
        const response = await botService.handleMessage(
            paramsDto.botId,
            bodyDto.content,
            bodyDto.thread_id,
        );

        return res.status(200).json({
            success: true,
            message: response.content,
        });
    } catch (error: unknown) {
        console.error('Error processing message:', error);

        if (error instanceof Error && error.message === 'Bot not found') {
            return res.status(404).json({
                success: false,
                error: 'Bot not found',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @swagger
 * /{botId}/settings:
 *   get:
 *     summary: Get bot settings
 *     tags: [Bot]
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the bot
 *     responses:
 *       200:
 *         description: Bot settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 settings:
 *                   $ref: '#/components/schemas/BotSettings'
 *       404:
 *         description: Bot not found
 *       500:
 *         description: Internal server error
 */
export async function getBotSettings(req: Request, res: Response): Promise<any> {
    try {
        const settings = await botService.getBotSettings(req.params.botId);
        return res.status(200).json({
            success: true,
            settings: settings || {},
        });
    } catch (error: unknown) {
        console.error('Error processing message:', error);

        if (error instanceof Error && error.message === 'Bot not found') {
            return res.status(404).json({
                success: false,
                error: 'Bot not found',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @swagger
 * /{botId}/conversations/{threadId}:
 *   get:
 *     summary: Get messages from a conversation thread
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the bot
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the conversation thread
 *     responses:
 *       200:
 *         description: Thread messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messages:
 *                   $ref: '#/components/schemas/ThreadMessages'
 *       404:
 *         description: Bot not found
 *       500:
 *         description: Internal server error
 */
export async function getThreadMessages(req: Request, res: Response): Promise<any> {
    try {
        const messages = await botService.getThreadMessages(req.params.botId, req.params.threadId);
        return res.status(200).json({
            success: true,
            messages,
        });
    } catch (error: unknown) {
        console.error('Error processing message:', error);

        if (error instanceof Error && error.message === 'Bot not found') {
            return res.status(404).json({
                success: false,
                error: 'Bot not found',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
}
