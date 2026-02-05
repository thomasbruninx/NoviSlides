# AGENTS.md
## Project AI & Contributor Guidance

This document defines **how AI agents (Codex, Copilot, ChatGPT, etc.) and human contributors should reason about, extend, and modify this project**.

The goal is consistency, maintainability, and predictable evolution — not just “making it work”.

---

## 1. Project Overview

This project is a **browser-based multi-screen slideshow system** consisting of:

- A **Viewer** that renders slideshows using Reveal.js
- An **Editor/Admin UI** that allows creating and editing slideshows using a canvas-based WYSIWYG editor (KonvaJS)
- A **SQLite database** (via Prisma) for persistence
- A **Next.js App Router** architecture
- A strong emphasis on **type safety, separation of concerns, and clean domain logic**

The application supports:
- Multiple slideshows
- Activation/deactivation of slideshows
- Multi-screen layouts per slideshow
- Locked aspect ratios per screen (default 1920×540)
- Templates for fast creation
- Drag/drop + resize editing
- Auto-slide timing and transitions

This is **not** a toy app. Code should be production-grade.

---

## 2. Technology Stack (Non-Negotiable)

- **Language:** TypeScript (strict)
- **Framework:** Next.js (App Router)
- **UI:** React + Mantine
- **Playback:** Reveal.js
- **Editor Canvas:** KonvaJS (`react-konva`)
- **Database:** SQLite via Prisma ORM
- **Validation:** Zod
- **Styling:** Mantine + minimal CSS (no CSS frameworks)
- **State Management:** Local React state and/or TanStack Query (if used, use it properly)

Avoid introducing new libraries unless there is a **clear, justified benefit**.

---

## 3. Architectural Principles

### 3.1 Separation of Concerns

**DO NOT**:
- Put database logic in React components
- Put business rules in API route handlers
- Let components directly shape database models

**DO**:
- Keep logic layered:
  - UI → API → Service → Repository → Database
- Use services for business rules
- Use repositories for data access
- Use DTOs / typed responses between layers

---

### 3.2 Folder Responsibilities

| Folder | Responsibility |
|------|---------------|
| `/app` | Routing, pages, API endpoints |
| `/components` | Pure UI components (no DB logic) |
| `/lib/repositories` | Prisma access only |
| `/lib/services` | Business logic, transactions |
| `/lib/templates` | Slideshow/screen/slide template definitions |
| `/lib/validation` | Zod schemas |
| `/lib/types` | Shared domain + DTO types |
| `/lib/utils` | Pure helper functions |
| `/prisma` | Prisma schema and migrations |

If a file grows beyond ~300 lines, **split it**.

---

## 4. Domain Model Rules

### 4.1 Slideshow

- Owns:
  - Screens
  - Global Reveal.js config
  - Activation state
- Only **one slideshow** may be active at a time.
- Activation must be transactional (deactivate others).

### 4.2 Screen

- Belongs to exactly one slideshow
- Has:
  - `key` (string identifier, unique per slideshow)
  - Locked width & height
- Aspect ratio must NEVER change after creation.
- Each screen has its **own slide deck**.

### 4.3 Slide

- Belongs to exactly one screen
- Ordered via `orderIndex`
- Supports auto-slide override and transition override

### 4.4 Slide Elements

- Types: `image`, `video`, `label`
- Positioned in **logical screen coordinates**
- Viewer scales them uniformly — editor never stores viewport-scaled values
- zIndex is meaningful and must be preserved

---

## 5. Templates Philosophy

Templates are **code-defined**, not DB-defined.

- Stored in `/lib/templates`
- Applied via a `TemplateService`
- A template may:
  - Create screens
  - Create slides
  - Create elements
- Default template MUST exist and be used when no template is chosen
- Applying a template is a **single transaction**

Templates should be:
- Deterministic
- Idempotent per creation
- Easy to read and modify

---

## 6. Editor Rules (Konva)

- Stage size == screen logical resolution (e.g. 1920×540)
- Never resize the stage itself to fit viewport — scale via container
- All transforms (drag, resize, rotate) update **logical coordinates**
- Persist changes on:
  - `dragend`
  - `transformend`
- Use optimistic updates; rollback on failure
- Editor-wide settings live in a modal component: `components/editor/EditorSettingsModal.tsx`

Avoid:
- Re-rendering entire canvas on small changes
- Direct DOM manipulation
- Hidden implicit state

---

## 7. Viewer Rules (Reveal.js)

- Viewer renders **purely from persisted data**
- No editor-only logic in viewer
- Use Reveal.js fragments for element animations
- Enforce aspect ratio using:
  - Fixed logical container
  - CSS scaling (letterbox/pillarbox if needed)

Viewer must support:
- `/show` → active slideshow + default screen
- `/show/[slideshowId]`
- `/show/[slideshowId]/screen/[screenKey]`

---

## 8. API Design Rules

- All endpoints:
  - Validate input with Zod
  - Return consistent response shape:
    ```ts
    { ok: true, data }
    { ok: false, error: { code, message, details? } }
    ```
- No silent failures
- No leaking Prisma errors directly to client
- Bulk operations (reorder, template apply) should be atomic

---

## 9. TypeScript Rules

- `any` is forbidden
- Use discriminated unions where appropriate
- Prefer explicit return types for services
- Shared types live in `/lib/types`
- Prisma models ≠ API DTOs (map explicitly when needed)

---

## 10. AI Agent Instructions (Important)

When using Codex or similar tools:

- Always **read existing code before generating new code**
- Prefer extending existing patterns over inventing new ones
- If adding a feature:
  1. Update domain types
  2. Update service logic
  3. Update API
  4. Update UI
- Never bypass services to “get something working”
- If unsure, **add TODO comments instead of guessing**

Codex should assume:
> “This codebase will be maintained for years, by humans.”

---

## 11. Non-Goals (Do NOT Add Unless Explicitly Requested)

- Authentication / authorization
- Real-time collaboration
- Multi-user locking
- Heavy animation frameworks
- Custom rendering engines

---

## 12. Quality Bar

Every change should aim to be:
- Readable
- Typed
- Testable (where reasonable)
- Predictable

If a shortcut is taken, **document why**.

---

End of AGENTS.md
