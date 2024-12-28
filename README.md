# DH Media Bot System

A TypeScript-based bot system that leverages OpenAI and LangChain for intelligent interactions with knowledge base integration. The system uses Prisma for database management and includes vector embeddings for efficient knowledge retrieval.

## Features

- Bot management system with message threading
- Knowledge base integration with PDF parsing capabilities
- Vector database for efficient similarity search
- Express.js REST API
- Prisma ORM with PostgreSQL
- Comprehensive test suite using Jest
- TypeScript with strict type checking

## Prerequisites

- Node.js (v18 or higher recommended)
- PostgreSQL database
- OpenAI API key

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration.

4. Initialize the database:

```bash
npx prisma migrate dev
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## Scripts

- `npm run build` - Build the TypeScript project
- `npm run serve` - Run the built application
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Project Structure

```
├── prisma/               # Database schema and migrations
├── src/
│   ├── __tests__/       # Test files
│   ├── controllers/     # API route controllers
│   ├── dto/            # Data Transfer Objects
│   ├── kb_files/       # Knowledge base PDF files
│   ├── scripts/        # Utility scripts
│   ├── services/       # Business logic
│   └── utils/          # Helper functions
├── .env                # Environment variables
├── .editorconfig      # Editor configuration
└── package.json       # Project dependencies and scripts
```

## Available Scripts

The `scripts/` directory contains utility scripts for bot management:

- `create_bot.ts` - Create a new bot instance
- `list_bots.ts` - List all available bots
- `populate_kb.ts` - Populate knowledge base from PDF files
- `test_vdb.ts` - Test vector database functionality

Run these scripts using:

```bash
npx tsx src/scripts/<script-name>.ts
```

## License

ISC
