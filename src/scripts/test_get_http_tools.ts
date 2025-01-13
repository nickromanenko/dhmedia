import { getHttpTools } from '../tools/http.tool.ts';

async function main(): Promise<void> {
    const response = await getHttpTools([
        {
            method: 'GET',
            url: 'http://localhost:3000/test',
            tool: {
                name: 'current_project_name',
                description: 'Get project name by the provided ID',
                schema: {
                    id: {
                        type: 'string',
                        description: 'The id of a provided project',
                    },
                },
            },
        },
    ]);

    console.log(response);
    return;
}

main().catch(console.error);
