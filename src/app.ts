import cors from 'cors';
import express, { Express, Request, Response, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.ts';
import { getBotSettings, getThreadMessages, handleMessage } from './controllers/bot.controller.ts';

export function createApp(): Express {
    const app: Express = express();
    const router: Router = express.Router();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Swagger documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    // Base route
    router.get('/', (req: Request, res: Response): any => res.json({ message: 'DHH API' }));

    // Messages endpoint
    router.post('/:botId/messages', handleMessage);

    router.get('/:botId/conversations/:threadId', getThreadMessages);

    // Bot settings endpoint
    router.get('/:botId/settings', getBotSettings);

    // Test
    router.get('/test', (req: Request, res: Response): any =>
        res.json({ message: 'Test' + req?.query?.id || '0' }),
    );
    router.post('/test', (req: Request, res: Response): any => res.json({ message: 'Test2' }));

    app.use(router);
    return app;
}
