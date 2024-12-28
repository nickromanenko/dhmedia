import 'dotenv/config';
import { VectorDBService } from '../services/vector_db.service.ts';
async function main(): Promise<any> {
    const vectorDB = new VectorDBService();
    const botId = '37ae52cc-89b5-4ae0-bcb2-3319e32d7142';

    const query = 'sustainability';

    const result = await vectorDB.querySimilar(query, botId, 5, 0.5);
    console.log(result.map((r) => r.content));
}

main().catch((error: any) => {
    console.error('Error:', error);
});
