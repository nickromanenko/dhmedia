import colors from 'colors';
import 'dotenv/config';

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VectorDBService } from '../services/vector_db.service.js';

try {
    // Get the directory path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const KB_FILES_DIR = path.join(__dirname, '..', 'kb_files');

    async function loadAndProcessPDFs(botId: string): Promise<void> {
        if (!botId) {
            throw new Error('Bot ID is required');
        }

        const vectorDB = new VectorDBService();
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        // Get all PDF files from the kb_files directory
        const pdfFiles = fs
            .readdirSync(KB_FILES_DIR)
            .filter((file) => file.toLowerCase().endsWith('.pdf'))
            .map((file) => path.join(KB_FILES_DIR, file));

        console.log(colors.blue(`Found ${pdfFiles.length} PDF files to process`));

        let i = 0;
        const len = pdfFiles.length;
        for (const pdfPath of pdfFiles) {
            try {
                i++;
                console.log(`${i}/${len} - ${pdfPath}`.yellow);

                // Load PDF
                const loader = new PDFLoader(pdfPath);
                const docs = await loader.load();

                // Split into chunks
                const chunks = await textSplitter.splitDocuments(docs);

                // Prepare chunks for storage
                const items = chunks.map((chunk: Document) => ({
                    content: chunk.pageContent,
                    metadata: {
                        ...chunk.metadata,
                        source: path.basename(pdfPath),
                    },
                }));

                // Store embeddings in batches
                const result = await vectorDB.batchStoreEmbeddings(items, botId);
                console.log(`Stored ${result.count} embeddings for ${path.basename(pdfPath)}`);
            } catch (error) {
                console.error(`Error processing ${path.basename(pdfPath)}:`.red, error);
                process.exit(1);
            }
        }
    }

    // Get bot ID from command line arguments
    const botId = process.argv[2];
    if (!botId) {
        console.error('Please provide a bot ID as a command line argument');
        process.exit(1);
    } else {
        console.log('OK, processing PDF files for bot ID:', botId);
    }

    // Run the script
    loadAndProcessPDFs(botId)
        .then(() => {
            console.log('Finished processing all PDF files');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
