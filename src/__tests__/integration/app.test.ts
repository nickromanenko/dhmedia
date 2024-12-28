import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../app.ts';

let app: Express;

beforeEach(() => {
    app = createApp();
});

describe('GET /', () => {
    it('should return 200 and correct message', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Express + TypeScript Server!');
    });

    it('should return 404 for non-existent route', async () => {
        const response = await request(app).get('/non-existent');
        expect(response.status).toBe(404);
    });
});
