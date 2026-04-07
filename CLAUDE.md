# CLAUDE.md

We're building the app described in @SPEC.MD. Read that file for general architectural
tasks or to double-check the exact database structure, tech stack or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or smth simmilar, you MUST look up the official documentation to ensure
that you're working with up-to-date information.
Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev      # Start development server at http://localhost:3000
bun run build    # Build for production
bun start    # Run production build
bun run lint     # Run ESLint
```

## Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Rich text editor**: TipTap v3 (`@tiptap/react`, `@tiptap/starter-kit`)
- **Auth**: better-auth
- **Validation**: Zod
- **Database**: SQLite at path set by `DB_PATH` env var (default: `data/app.db`)

## Environment

Copy `.env.example` to `.env.local` before running locally. Required variables:

- `BETTER_AUTH_SECRET` — must be 32+ characters
- `DB_PATH` — path to SQLite database file

## Architecture

This is a Next.js App Router project. All routes and UI live under `app/`. The root layout (`app/layout.tsx`) uses Geist fonts and sets up global styles. Currently the app is in early development — `app/page.tsx` is the starter template placeholder.
