import express, { Express, Request, Response } from 'express';

export function createApp(): Express {
    const app: Express = express();

    app.get('/', (req: Request, res: Response) => {
        res.send('Express + TypeScript Server!');
    });

    return app;
}
