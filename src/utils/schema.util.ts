import { z } from 'zod';
export function generateZodSchema(plainTextSchema: any): any {
    const schemaObj: any = {};
    for (let key in plainTextSchema) {
        const val = plainTextSchema[key];
        const description: any = val.description!;
        if (val.type === 'string') {
            schemaObj[key] = z.string().describe(description);
        } else if (val.type === 'number') {
            schemaObj[key] = z.number().describe(description);
        } else if (val.type === 'boolean') {
            schemaObj[key] = z.boolean().describe(description);
        } else if (val.type === 'array') {
            schemaObj[key] = z.array(z.string()).describe(description);
        } else {
            schemaObj[key] = z.unknown().describe(description);
        }
    }
    const schema = z.object(schemaObj);
    return schema;
}
