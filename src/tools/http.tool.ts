import { tool } from '@langchain/core/tools';
import axios from 'axios';
import { generateZodSchema } from '../utils/schema.util.ts';

const plainTextSchema: any = {
    id: {
        type: 'string',
        description: 'The ID of the project',
    },
};
export const httpTool = tool(
    async (input: any) => {
        try {
            // const response = await fetch(url, {
            //     method,
            //     headers: {
            //         'Content-Type': 'application/json',
            //         ...headers,
            //     },
            //     ...(body && { body: JSON.stringify(body) }),
            // });

            // const data = await response.json();
            // return JSON.stringify(data, null, 2);
            console.log(input);
            return 'Test12';
        } catch (error: any) {
            return `Error making HTTP request: ${error.message}`;
        }
    },
    {
        name: 'current_project_name',
        description: 'Get project name by provided ID',
        schema: generateZodSchema(plainTextSchema),
    },
);

export function getHttpTools(toolDefinitions: any[]): any[] {
    const tools: any = [];

    for (const toolDefinition of toolDefinitions) {
        const { method, url, tool: toolDesc } = toolDefinition;
        const { name, description, schema } = toolDesc;

        const newTool = tool(
            async (input: any) => {
                try {
                    const config: any = {
                        method,
                        url,
                    };
                    if (method === 'POST' || method === 'PUT') {
                        config.data = input;
                    }
                    if (method === 'GET' || method === 'DELETE') {
                        config.params = input;
                    }
                    const response = await axios(config);
                    return response.data;
                } catch (error: any) {
                    return `Error making HTTP request: ${error.message}`;
                }
            },
            {
                name,
                description,
                schema: generateZodSchema(schema),
            },
        );

        tools.push(newTool);
    }

    return tools;
}
