# NoviSlides

A lightweight digital signage content provider, built as a full-stack web application using Next.js, Mantine, Reveal.js, Konva, and SQLite (Prisma).

## Features
- Viewer endpoints for active and specific slideshows/screens
- Live refresh for viewer devices via SSE with polling fallback
- WYSIWYG editor with drag/drop, resize, layers, and label editing
- Media Library with image + video assets
- Multi-screen decks with locked resolutions (default 1920 x 540)
- Template system with default starter template
- SQLite persistence via Prisma

## Setup
1. Install dependencies

```bash
npm install
```

2. Configure the database (SQLite by default)

create a `.env` file in the root with the following content:
```
DATABASE_URL="file:./prisma/dev.db"
```

Optional (for Google Fonts dropdown in the editor):
```
GOOGLE_FONTS_API_KEY="your-google-fonts-api-key"
```

3. Run Prisma migrations

```bash
npm run prisma:migrate
```

4. Start the dev server

```bash
npm run dev
```

Important: SSE doesn't work in development mode, so live refresh of the viewer doesn't get triggered when saving changes in the editor

## Setup
Deploy a production-ready version
1. Run the build command

```bash
npm run build
```

2. Start the production server

```bash
npm run start
```

## Using the Editor
- Open `http://localhost:3000/edit`
- Create a slideshow (choose a template or accept the default)
- Add screens, slides, and elements
- Use **Add Media** to upload/select images or videos
- Activate a slideshow from the left sidebar

### Create a demo slideshow
Use the **Create Demo** button in the editor. It creates a multi-screen slideshow with `main` and `side` screens.

## Viewer Endpoints
- `GET /show` active slideshow, default screen
- `GET /show/[slideshowId]` specific slideshow, default screen
- `GET /show/[slideshowId]/screen/[screenKey]` specific screen

If no active slideshow exists, the viewer shows a friendly empty state.

### Live refresh (SSE)
Viewer pages subscribe to `GET /api/events?slideshowId=...&screenKey=...` and refresh when the screen revision changes. If SSE fails, the viewer falls back to polling every ~15 seconds.

Note: the current EventHub is in-memory, so live refresh only works within a single server instance.

## Templates
Templates are defined in `lib/templates/templates.ts` and are applied at creation.

Included templates:
1. **Default Starter** (default): Title + subtitle, image + caption
2. **Fullscreen Image**: Two full-bleed image slides
3. **Info Layout**: Left text column, right image area

If you create a slideshow without choosing a template, the Default Starter is applied automatically.

## Default Resolution
New slideshows and screens default to **1920 x 540**. You can override width/height when creating screens.

## Media Library
Supported formats:
- Images: `png`, `jpeg/jpg`, `gif`, `webp`, `svg`
- Videos: `mp4`, `webm`

Media assets are stored under `public/uploads/YYYY/MM/uuid.ext`.

Video playback notes:
- Videos render in the viewer via a standard `<video>` element.
- Autoplay, loop, muted, and controls are configured per element. (however audio playback is limited due to policies set by modern browsers)

## Tests
- Unit test (Vitest): `npm run test:unit`
- Playwright smoke test: `npm run test:e2e`

## Project Structure
- `app/` routes (viewer, editor, API)
- `components/` viewer/editor UI
- `lib/` services, repositories, templates, validation, utils
- `prisma/` schema and migrations
- `public/uploads/` uploaded assets

## Disclaimer on the use of AI

This project has been developed with the assistance of AI tools (notably GitHub Copilot and ChatGPT Codex) to help speed up development and provide code suggestions. While these tools can be helpful, they may also introduce code that is suboptimal, insecure, or incorrect. Which I experienced firsthand while reviewing and debugging the generated code. I don't blindly trust AI-generated code, and neither should you. Always review, test, and validate any code produced with the help of AI tools.
