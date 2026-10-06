# CampusFix PWA Architecture (Day 12)

CampusFix is an offline-first, location-aware campus complaint management system built as a Progressive Web App (PWA).

## Architecture

The PWA functionality is powered by `vite-plugin-pwa` which handles the generation of the Web App Manifest and the Service Worker (using Workbox).

### Service Worker Purpose

The Service Worker is strictly responsible for caching static assets (HTML, CSS, JS, images, icons) to ensure the application shell loads quickly and reliably, even when offline.

**Note:** The Service Worker is *not* used for data synchronization (e.g., saving or syncing complaints).

### Offline UX & IndexedDB

Data synchronization is explicitly handled by IndexedDB (via Dexie.js) and the custom `syncService`. 
- **Offline Saving:** When a user submits a complaint while offline, it is stored in IndexedDB.
- **Syncing:** When the network connection is restored (detected via `navigator.onLine` and window `online` events), `syncService` retrieves pending complaints from IndexedDB and sends them to the backend API.
- **UI Feedback:** A global `<NetworkStatus />` component provides clear feedback, showing an offline warning and indicating when pending items are syncing.

### Manifest and Installability

The Web App Manifest (`manifest.webmanifest`) configures how the PWA behaves when installed on a user's device:
- **name / short_name**: CampusFix
- **description**: Offline-first campus complaint management system
- **display**: standalone (removes browser chrome for a native app feel)
- **theme_color**: #aa3bff (app accent color)
- **background_color**: #ffffff
- **icons**: 192x192, 512x512, and 180x180 (for Apple Touch Icon)

When the manifest, icons, and service worker are properly served over HTTPS (or localhost for development), modern browsers will prompt the user to install the application.

## How to Test PWA Locally

1. Build the production application:
   ```bash
   cd client
   npm run build
   ```
2. Serve the production build:
   ```bash
   npx serve -s dist
   ```
3. Open the provided localhost URL in your browser.
4. Open Developer Tools (F12) -> Application -> Service Workers to verify it is registered.
5. In the Network tab, toggle "Offline" to test the offline UX and saving functionality.

**IMPORTANT:** Do NOT claim that the localhost development build (`npm run dev`) is fully equivalent to production PWA behavior. Dev mode does not strictly register the production service worker or cache assets in the same way. Production/preview testing (using a static file server like `serve` over the `dist` folder) must be used for final installability verification.
