# AI IDE Frontend

Next.js app with Monaco editor, Supabase, and Tailwind CSS.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Add your environment variables to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Lint

```bash
npm run lint
```
