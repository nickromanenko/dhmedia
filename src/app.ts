import express, { Express, Request, Response, Router } from 'express';
import { handleMessage } from './controllers/bot.controller.ts';

export function createApp(): Express {
    const app: Express = express();
    const router: Router = express.Router();

    // Middleware
    app.use(express.json());

    // Base route
    router.get('/', (req: Request, res: Response): any => res.json({ message: 'DHH API' }));

    // Messages endpoint
    router.post('/:botId/messages', handleMessage);

    app.use(router);
    return app;
}
