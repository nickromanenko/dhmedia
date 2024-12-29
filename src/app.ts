import cors from 'cors';
import express, { Express, Request, Response, Router } from 'express';
import { getBotSettings, getThreadMessages, handleMessage } from './controllers/bot.controller.ts';

export function createApp(): Express {
    const app: Express = express();
    const router: Router = express.Router();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Base route
    router.get('/', (req: Request, res: Response): any => res.json({ message: 'DHH API' }));

    // Messages endpoint
    router.post('/:botId/messages', handleMessage);

    router.get('/:botId/conversations/:threadId', getThreadMessages);

    // Bot settings endpoint
    router.get('/:botId/settings', getBotSettings);

    app.use(router);
    return app;
}
