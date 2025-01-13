import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DHH API Documentation',
            version: '1.0.0',
            description: 'API documentation for the DHH Media service',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Message: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'The content of the message',
                        },
                    },
                    required: ['content'],
                },
                ThreadMessages: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            content: {
                                type: 'string',
                                description: 'The content of the message',
                            },
                            role: {
                                type: 'string',
                                description: 'The role of the message sender',
                                enum: ['user', 'assistant'],
                            },
                            createdAt: {
                                type: 'string',
                                format: 'date-time',
                                description: 'The timestamp when the message was created',
                            },
                        },
                    },
                },
                BotSettings: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'The unique identifier of the bot',
                        },
                        name: {
                            type: 'string',
                            description: 'The name of the bot',
                        },
                        widgetSettings: {
                            type: 'object',
                            description: 'Widget configuration settings',
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/controllers/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
