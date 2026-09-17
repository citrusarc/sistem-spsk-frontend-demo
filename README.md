# SPSK Frontend

Vue frontend for **Sistem Pemantauan Semakan Kontrak (SPSK)**. It tracks
contract reviews against a 30-working-day deadline and shows in-app
traffic-light alerts.

The Express backend lives in a separate repo (`sistem-spsk-backend-demo`).
The documents below are kept there:

| Document | What's in it |
| --- | --- |
| `SPEC.md` (backend repo) | Requirements, roles, workflow statuses, DB schema. **Source of truth** |
| `API.md` (backend repo) | Endpoint contract: routes, payloads, errors, role access |
| [CLAUDE.md](CLAUDE.md) | UI rules for this repo: theme, badge colours, Bahasa Melayu text |

## Stack

Vue 3 (`<script setup>` + TypeScript) · Vite 8 · Vue Router · Tailwind CSS v4 ·
shadcn-vue components (on reka-ui) · lucide icons · vue-sonner (toasts).

No mock server or demo data. The app always talks to the real backend.

## Local setup

**Requirements:**
- **Node.js 20.19+ or 22.12+.** Vite 8 doesn't support older versions (see
  [Troubleshooting](#troubleshooting)).
- **SPSK backend** running at `http://localhost:3000`.

1. Start the backend first. Setup steps are in the backend repo's README.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`. The backend's CORS only allows this origin,
   so keep port 5173.

The backend URL is set in one place only: `BASE_URL` in
[src/lib/api.ts](src/lib/api.ts).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check (`vue-tsc`) and build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## Default accounts

Created by the backend's `seed.js`. The initial password for all of them is
**`123456`**. Change it after first login from the profile menu →
**Tukar Kata Laluan**.

| Email | Role | Lands on |
| --- | --- | --- |
| admin@moha.gov.my | `ADMIN` | Pengurusan Pengguna |
| ptkontrak@moha.gov.my | `PT_KONTRAK` | Dashboard |
| puu@moha.gov.my | `PUU` | Dashboard |
| penyemak1@moha.gov.my | `PEGAWAI_PENYEMAK` | Dashboard |
| penyemak2@moha.gov.my | `PEGAWAI_PENYEMAK` | Dashboard |

## Screens

| Route | Screen | Roles |
| --- | --- | --- |
| `/login` | Log masuk | Public |
| `/dashboard` | Dashboard: phase counts, alert counts, contract list | PT_KONTRAK, PUU, PEGAWAI_PENYEMAK |
| `/kontrak` | Senarai Kontrak (placeholder, not built yet) | PT_KONTRAK, PUU, PEGAWAI_PENYEMAK |
| `/kontrak/baharu` | Daftar Kontrak Baharu: form + PDF upload | PT_KONTRAK |
| `/kontrak/pengesahan` | Pengesahan Kontrak: approve or reassign reviewer | PUU |
| `/tugasan-saya` | Tugasan Saya: mark review done | PEGAWAI_PENYEMAK |
| `/pengguna` | Pengurusan Pengguna: add, edit, deactivate, reset password | ADMIN |
| `/notifikasi` | Notifikasi: full inbox with all/unread filter | All |
| `/kata-laluan` | Tukar Kata Laluan: change own password | All |

Access is checked in the router ([src/router/index.ts](src/router/index.ts))
and mirrored in the sidebar. The backend still enforces it: a user who opens
a route they shouldn't gets `403` from the API. `ADMIN` has no contract
access, so it only sees user management.

## How it works

**Auth.** The JWT is stored in `localStorage` and sent as
`Authorization: Bearer`. Any `401` response logs the user out and returns
them to `/login`. This also covers an account that `ADMIN` deactivates
mid-session.

**Notifications.** There's no push from the backend. After login, the app:
- loads the inbox (`GET /api/notifications`),
- checks `GET /api/notifications/unread-count` every 30 seconds and when the
  browser tab becomes active again,
- reloads the inbox when the count changes and shows a toast for each new
  notification.

Unread notifications appear on the bell (top right) and the Notifikasi page.
Both read from the same store ([src/lib/notifications.ts](src/lib/notifications.ts)),
so their counts always match.

Toast colours:

| Colour | Used for |
| --- | --- |
| Red | `AMARAN_MERAH`, failed actions |
| Amber | `AMARAN_KUNING`, `AMARAN_JINGGA` |
| Green | `SEMAKAN_SELESAI`, `KONTRAK_DITUTUP`, successful actions |
| Blue | `PENUGASAN_BARU`, unread summary on login |
| Grey | Any notification type the frontend doesn't know yet |

## Theme

shadcn-vue theme colours in [src/style.css](src/style.css), using the
Sistem Aduan Integriti palette:

| Token | Colour | Used for |
| --- | --- | --- |
| `primary` | Deep navy `#1E3A5F` | Buttons, links, focus rings |
| `sidebar` | Deep navy | Sidebar, dashboard banner, login panel |
| `sidebar-primary` | Bright gold `#E8B546` | Logo, avatar, active menu icon, dashboard button |
| `background` | Warm off-white `#F6F5F2` | Page background |

Status badge colours (`status_semasa`, `status_warna`, `tahap_keutamaan`)
follow the tables in [CLAUDE.md](CLAUDE.md) and live in
[src/lib/status.ts](src/lib/status.ts).

The login page photo is `public/images/hero-putrajaya.jpg`. It was reused
from the Sistem Aduan Integriti project. **Confirm its licence and whether it
needs a credit before production.**

## Project structure

```
public/images/            Login page photo
src/
  main.ts                 App entry — registers the 401 → logout handler
  App.vue                 Router view + toast container
  style.css               Tailwind + shadcn-vue theme tokens
  router/index.ts         Routes, auth guard, role guard
  layouts/AppLayout.vue   Sidebar + top header (bell) + page area
  lib/
    api.ts                Only place that calls fetch; types match API.md
    auth.ts               Current user, login/logout
    notifications.ts      Shared inbox state, polling, toasts
    status.ts             Badge labels/colours, role labels
  components/
    AppSidebar.vue        Role-based navigation + profile menu
    NotificationBell.vue  Bell popover (latest 5)
    NotificationItem.vue  One notification row (bell + inbox page)
    ui/                   shadcn-vue components
  views/                  One file per screen (see Screens)
```

### Adding shadcn-vue components

The `shadcn-vue` CLI (`npx shadcn-vue add …`) crashes on Node 20.17. Add
components by hand from the shadcn-vue source into `src/components/ui/`, or
upgrade Node first.

## Troubleshooting

**`npm run build` fails with `Cannot find module '@rolldown/binding-darwin-arm64'`.**
Your Node version is older than 20.19. npm then skips Vite's native build
module on every install. Upgrade Node (22 LTS recommended). As a stopgap:

```bash
npm install --no-save @rolldown/binding-darwin-arm64@1.2.9
```

Use the version listed under `optionalDependencies` in
`node_modules/rolldown/package.json`.

**Editor shows `File '@vue/tsconfig/tsconfig.dom.json' not found`.**
Run `npm install`, then **Vue: Restart Vue and TS servers** (or
**Developer: Reload Window**).

**Toasts or data never load / everything redirects to login.**
Check the backend is running on port 3000 and that the dev server is on port
5173 (CORS).

## Known gaps

- **Senarai Kontrak** (`/kontrak`) is a placeholder.
- No contract detail, PDF download, re-review or audit log screens yet. The
  backend endpoints they need (#6, #7, #10, #12 in `API.md`) aren't
  implemented, and PUU's second review (#9) isn't either.
- `triggerAlerts()` (#17) exists in `api.ts` but no screen calls it.
