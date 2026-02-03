# NoviSlides

A production-ready multi-screen slideshow editor and viewer built with Next.js App Router, Mantine, Reveal.js, Konva, and SQLite (Prisma).

## Features
- Viewer endpoints for active and specific slideshows/screens
- WYSIWYG editor with drag/drop, resize, layers, and label editing
- Multi-screen decks with locked resolutions (default 1920 x 540)
- Template system with default starter template
- SQLite persistence via Prisma

## Setup
1. Install dependencies

```bash
npm install
```

2. Configure the database (SQLite by default)

```bash
# .env already contains DATABASE_URL="file:./prisma/dev.db"
```

3. Run Prisma migrations

```bash
npm run prisma:migrate
```

4. Start the dev server

```bash
npm run dev
```

## Using the Editor
- Open `http://localhost:3000/edit`
- Create a slideshow (choose a template or accept the default)
- Add screens, slides, and elements
- Activate a slideshow from the left sidebar

### Create a demo slideshow
Use the **Create Demo** button in the editor. It creates a multi-screen slideshow with `main` and `side` screens.

## Viewer Endpoints
- `GET /show` — active slideshow, default screen
- `GET /show/[slideshowId]` — specific slideshow, default screen
- `GET /show/[slideshowId]/screen/[screenKey]` — specific screen

If no active slideshow exists, the viewer shows a friendly empty state.

## Templates
Templates are defined in `lib/templates/templates.ts` and are applied at creation.

Included templates:
1. **Default Starter** (default): Title + subtitle, image + caption
2. **Fullscreen Image**: Two full-bleed image slides
3. **Info Layout**: Left text column, right image area

If you create a slideshow without choosing a template, the Default Starter is applied automatically.

## Default Resolution
New slideshows and screens default to **1920 x 540**. You can override width/height when creating screens.

## Tests
- Unit test (Vitest): `npm run test:unit`
- Playwright smoke test: `npm run test:e2e`

## Project Structure
- `app/` — routes (viewer, editor, API)
- `components/` — viewer/editor UI
- `lib/` — services, repositories, templates, validation, utils
- `prisma/` — schema and migrations
- `public/uploads/` — uploaded assets
