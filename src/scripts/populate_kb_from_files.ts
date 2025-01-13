import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import 'dotenv/config';
import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import * as pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { VectorDBService } from '../services/vector_db.service.js';

async function extractTextFromDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

async function extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

async function processFile(
    filePath: string,
    botId: string,
    vectorDb: VectorDBService,
): Promise<void> {
    try {
        const ext = path.extname(filePath).toLowerCase();
        let text: string;

        // Extract text based on file type
        if (ext === '.docx') {
            text = await extractTextFromDocx(filePath);
        } else if (ext === '.pdf') {
            text = await extractTextFromPdf(filePath);
        } else {
            console.warn(`Skipping unsupported file type: ${filePath}`);
            return;
        }

        // Split text into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await splitter.createDocuments([text]);

        // Store chunks in vector database
        await vectorDb.batchStoreEmbeddings(
            chunks.map((chunk: { pageContent: string; metadata?: { loc?: string } }) => ({
                content: chunk.pageContent,
                metadata: {
                    source: path.basename(filePath),
                    loc: chunk.metadata?.loc || 'unknown',
                },
            })),
            botId,
        );

        console.log(`Successfully processed ${filePath}`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

async function main(): Promise<void> {
    try {
        // Ensure bot ID is provided
        const botId = process.argv[2];
        if (!botId) {
            console.error('Please provide a bot ID as an argument');
            process.exit(1);
        }

        const vectorDb = new VectorDBService();
        const kbDir = path.join(process.cwd(), 'src', 'kb_files');

        // Get all files in the kb_files directory
        const files = fs.readdirSync(kbDir);

        // Filter for PDF and DOCX files
        const validFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.pdf' || ext === '.docx';
        });

        if (validFiles.length === 0) {
            console.log('No PDF or DOCX files found in kb_files directory');
            return;
        }

        // Process each file
        for (const file of validFiles) {
            const filePath = path.join(kbDir, file);
            await processFile(filePath, botId, vectorDb);
        }

        console.log('Finished processing all files');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
