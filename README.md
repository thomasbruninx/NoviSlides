# NoviSlides

A lightweight digital signage content provider, built as a full-stack web application using Next.js, Mantine, Reveal.js, Konva, and SQLite (Prisma).

## Features
- Display endpoints for mounted slideshows
- Live refresh for viewer devices via SSE with polling fallback
- WYSIWYG editor with drag/drop, resize, layers, ...
- Slides with text, images, videos, shapes, and more
- Animations and transitions via Reveal.js
- Use Google Fonts in text elements (if free API key provided)
- Use Google Material Icons in icon elements
- Media Library with image + video assets
- Locked slide resolution (default 1920 x 540)
- Single-screen playback per slideshow
- Display management + slideshow mounting workflow
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

Important: SSE doesn't work in development mode, live refresh of the viewer falls back to long polling.

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
- Add slides and elements
- Use **Add Media** to upload/select images or videos
- Mount a slideshow to a display from the left sidebar
- Unmount per slideshow or use **Unmount All** from the left sidebar
- Manage displays in **Settings** (name + resolution)

### Create a demo slideshow
Use the **Create Demo** button in the editor. It creates a starter slideshow with sample content.

## Viewer Endpoints
- `GET /show` list available display endpoints and direct slideshow endpoints
- `GET /show/[slideshowId]` specific slideshow
- `GET /display/[name]` slideshow mounted to that display

If no slideshows or displays exist, `/show` shows an empty state.
Activation-based endpoints are removed; mounting to displays is the only assignment workflow.

### Live refresh (SSE)
Viewer pages subscribe to `GET /api/events?slideshowId=...&screenKey=...` and refresh when slideshow content changes. Display pages also subscribe to mount-change events for their display name and reload when remounted. If SSE fails, the viewer falls back to polling every ~15 seconds.

Note: the current EventHub is in-memory, so live refresh only works within a single server instance.

## Templates
Templates are defined in `lib/templates/templates.ts` and are applied at creation.

Included templates:
1. **Default Starter** (default): Title + subtitle, image + caption
2. **Fullscreen Image**: Two full-bleed image slides
3. **Info Layout**: Left text column, right image area

If you create a slideshow without choosing a template, the Default Starter is applied automatically.

## Default Resolution
New slideshows default to **1920 x 540**. You can override this in the slideshow creation modal.

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
