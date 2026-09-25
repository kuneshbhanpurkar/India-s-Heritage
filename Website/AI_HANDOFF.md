# Dharohar Website: AI Handoff

**Snapshot date:** 2026-09-23
**Project:** `Website/`
**Product:** Indian Heritage / Dharohar public heritage explorer
**Frontend stack:** React 19, TypeScript, Vite 8, Tailwind CSS 4, `lucide-react`, Motion
**Backend location:** sibling `backend/` project

## 1. Current Condition

The Website is a Vite React single-page application. It compiles and produces a production bundle with the current dependencies.

Verified from `Website/`:

- `npm run lint` passes (`tsc --noEmit`).
- `npm run build` passes.
- Vite emits a warning that `vite.config.ts` uses `__dirname`, which may be unsupported when Vite's native config loader becomes the default.
- There is no frontend test script or test suite in `package.json`.
- The application currently expects a running backend at `http://localhost:8080` unless `VITE_API_URL` is set.
- The frontend source is mostly API-driven now, but large static datasets remain in `src/data/` as legacy/mock content.
- The backend modular route handlers currently return `501 Not implemented`; therefore the Website can build but normal data/auth flows will fail until backend handlers are implemented or the old implementation is restored.

## 2. Directory Map

```text
Website/
  index.html                 HTML shell, metadata, Google Fonts and Material Symbols
  package.json               npm scripts and dependencies
  README.md                 Original AI Studio starter README; stale for current app
  tsconfig.json              TypeScript/Vite compiler configuration
  vite.config.ts             React + Tailwind Vite configuration
  src/
    main.tsx                React root with StrictMode
    App.tsx                 Application state, data loading, route/view switching
    api.ts                  Fetch wrapper, frontend API contract, response mapping
    types.ts                Shared UI domain types
    index.css               Global styles and Tailwind/theme CSS
    components/
      Header.tsx
      Footer.tsx
      LandingPage.tsx
      AuthPage.tsx
      HomeDashboard.tsx
      AroundMeMap.tsx
      ExploreSearch.tsx
      MonographDetail.tsx
      PassportView.tsx
      MonumentCard.tsx
      FavoritesDrawer.tsx
      StateDistrictModal.tsx
      DirectionsModal.tsx
      MediaModal.tsx
      TicketPassModal.tsx
    data/
      statesAndDistricts.ts  Large legacy static state/district directory
      heritageData.ts        Large legacy static heritage-site dataset
      cityCardsData.ts       Large legacy static city-card dataset
```

## 3. Application Entry and Main Flow

`src/main.tsx` mounts `<App />` into `#root` under React `StrictMode` and imports `index.css`.

`src/App.tsx` is the application coordinator. It owns:

- Authenticated user and token state.
- Current logical page route.
- Loaded heritage sites.
- Published states and districts.
- Selected state, district, and site.
- Map center.
- Favorite site IDs.
- Media, directions, favorites, and state/district modal state.
- The post-login welcome banner.

There is no React Router. Navigation is a `PageRoute` union and conditional JSX in `App.tsx`:

```ts
'landing' | 'home' | 'explore' | 'around-me' | 'passport' | 'monograph' | 'auth'
```

The browser URL does not change when views change.

### Initial load

1. Read `indian_heritage_user` and `indian_heritage_token` from `localStorage`.
2. Authenticated users initially target `home`; unauthenticated users target `landing`.
3. Load public states and districts through the API.
4. For an authenticated user, match their stored `state` and `district` by case-insensitive name.
5. For an unauthenticated user, select the first available live state and district for landing-page directory content.
6. Load content for the active district and map each backend content item to a `HeritageSite`.
7. If a token exists, call `/api/users/me`; clear local auth state when that request fails.

### Unauthenticated behavior

Unauthenticated users are limited to the landing and auth views. Attempts to access other views open the sign-in page. Landing-page exploration actions generally open sign-up/auth rather than allowing unrestricted detail access.

### Authenticated views

- `home`: `HomeDashboard`
- `around-me`: `AroundMeMap`
- `explore`: `ExploreSearch`
- `monograph`: `MonographDetail`
- `passport`: `PassportView`
- `landing`: `LandingPage` is still available
- `auth`: `AuthPage`

Global `Header`, `Footer`, `FavoritesDrawer`, `MediaModal`, and `DirectionsModal` are rendered by `App` as appropriate.

## 4. Component Responsibilities

- `Header.tsx`: top navigation, route actions, profile menu, map/favorites controls, selected state/district labels.
- `Footer.tsx`: bottom navigation actions.
- `LandingPage.tsx`: hero, city/district directory, region/state/search/sort filtering, pagination, city preview/auth entry. It builds cards from API-loaded `publishedStates`, not the static city-card dataset.
- `AuthPage.tsx`: sign-in and registration forms. Loads states and districts from the API, validates basic required fields client-side, then calls auth API functions.
- `HomeDashboard.tsx`: authenticated district dashboard and site cards.
- `AroundMeMap.tsx`: Google Maps loader and map display, category/search filtering, markers, fallback cartographic image, zoom and map controls.
- `ExploreSearch.tsx`: searchable/filterable heritage site exploration.
- `MonumentCard.tsx`: reusable site card.
- `MonographDetail.tsx`: detailed site/heritage record, media actions, save and directions actions.
- `PassportView.tsx`: user profile, editable display name, saved/favorite sites.
- `FavoritesDrawer.tsx`: saved site list with detail/directions actions.
- `StateDistrictModal.tsx`: state/district selection and action choice (`map`, `explore`, or `apply`).
- `DirectionsModal.tsx`: Google Maps directions preview/embed and external maps link.
- `MediaModal.tsx`: image/video media presentation.
- `TicketPassModal.tsx`: ticket/pass UI component; verify usage before changing or deleting.

## 5. Frontend API Contract

`src/api.ts` uses:

```ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
```

Every request sends `Content-Type: application/json`. Non-2xx responses are converted to an `Error` using `body.error` or `Request failed`.

Expected endpoints:

| Method | Endpoint | Auth | Used by |
|---|---|---|---|
| GET | `/api/public/states` | No | App, AuthPage |
| GET | `/api/public/states/:stateId/districts` | No | App, AuthPage |
| GET | `/api/public/content?districtId=...` | No | App |
| POST | `/api/users/login` | No | AuthPage |
| POST | `/api/users/register` | No | AuthPage |
| GET | `/api/users/me` | Bearer user token | App |
| PUT | `/api/users/me` | Bearer user token | PassportView/App |

The frontend also assumes a backend health route at `GET /health`, although `api.ts` does not currently expose a helper for it.

Expected response shapes:

```ts
PublicState = {
  _id: string;
  name: string;
  code: string;
  active: boolean;
}

PublicDistrict = {
  _id: string;
  stateId: string;
  name: string;
  active: boolean;
  coverImage?: string;
  description?: string;
  coordinates?: { lat: number; lng: number };
}

UserProfileResponse = {
  id: string;
  name: string;
  email: string;
  state: string;
  district: string;
}
```

Content is mapped by `toHeritageSite()` in `api.ts`. Backend `fields` are expected to be a flexible object containing optional values such as `imageUrl`, `subTitle`, `category`, `dynasty`, `city`, `distanceKm`, `rating`, `description`, `openingHours`, `statusBadge`, `verifiedType`, `directionTimeMinutes`, `hasAudio`, `builtYear`, `visitorTariffs`, and `transitOptions`.

## 6. Authentication and Persistence

The frontend stores:

- `indian_heritage_token`: bearer token string.
- `indian_heritage_user`: JSON profile cache.
- `indian_heritage_favorites`: JSON array of site IDs.

On successful login or registration, `App.handleAuthSuccess()` stores the token/profile, selects the matching state/district, loads district content, and navigates to `home`.

On user-profile failure, the token and cached user are removed and the app returns to unauthenticated state.

Favorites are local-only. There is no backend favorite endpoint.

The `rememberMe` state exists in `AuthPage`, but the current flow does not use it to alter persistence; auth data is always written to `localStorage` by `App`.

## 7. Maps and External Assets

`AroundMeMap.tsx` dynamically inserts the Google Maps JavaScript API script. It prefers:

```text
VITE_GOOGLE_MAPS_API_KEY
```

but currently contains a hard-coded fallback Google API key. This is a security and ownership risk; remove the fallback and use a configured environment variable or disable the integration when absent.

If Google Maps fails, the component displays a static cartographic image and HTML overlay pins. `DirectionsModal.tsx` embeds Google Maps using coordinates and provides an external Google Maps link.

The UI also loads Google Fonts and Material Symbols from `fonts.googleapis.com`, and many UI/data images come from Unsplash or `lh3.googleusercontent.com` URLs. These are runtime network dependencies and are not bundled locally.

## 8. Legacy and Mock Data

The following modules contain substantial static content:

- `src/data/statesAndDistricts.ts`
- `src/data/heritageData.ts`
- `src/data/cityCardsData.ts`

Current primary flow:

- `App.tsx` imports only the `StateInfo` and `DistrictInfo` types from `statesAndDistricts.ts`.
- `LandingPage.tsx` imports `StateInfo` types and `CityHeritageCard` type, but constructs live cards from API data.
- The exported static arrays are not the main runtime source for the current App flow.

Do not delete these modules without confirming all indirect/unused imports first. They may represent the intended fallback/demo data and are useful for understanding the product content model.

## 9. Backend Integration Status

The sibling backend has two relevant layers:

- `backend/src/app.js`: modular Express app with `/health`, `/api/auth`, `/api/users`, `/api/public`, and `/api/admin` mounts.
- `backend/src/server.js`: startup process that imports `app.js`, loads dotenv, configures DNS, adds a root response, additionally mounts routers, and listens on `PORT || 8080`.

The modular controller handlers currently return `501 Not implemented`. Consequently:

- `/health` should work.
- Public state/district/content calls return `501` unless backed by another implementation.
- User login/register/profile/update return `501` or auth middleware responses.
- The Website auth and directory flows cannot operate end-to-end against only the current modular stubs.

`server.js` also mounts the routers again without the `/api/...` prefixes already configured in `app.js`. These extra mounts create redundant routes such as `/states`, `/login`, and `/content`, and should be removed once the backend entry point is stabilized. Do not change backend behavior casually; coordinate with the backend handoff.

## 10. Known Issues and Risks

### High priority

1. **Backend handlers are placeholders.** Implement the backend controllers or explicitly reconnect the Website to the previous database-backed implementation before testing end-to-end flows.
2. **Google API key is hard-coded in source.** Remove the fallback key from `AroundMeMap.tsx` and configure `VITE_GOOGLE_MAPS_API_KEY` securely.
3. **Backend server has duplicate router mounting.** `server.js` imports `app`, which already mounts prefixed routers, then mounts the same routers again at root paths.

### Medium priority

4. **README is stale.** It describes an AI Studio/Gemini starter and `GEMINI_API_KEY`, but the current app is a heritage explorer using a local Express API and Google Maps.
5. **No automated tests.** Add at least API contract tests, auth flow tests, and a smoke test for unauthenticated/authenticated view gating.
6. **No error/loading UI around initial directory loading.** `App` clears lists on failure, which can appear as an empty page without explaining that the API is unavailable.
7. **Static and live content models coexist.** Decide whether static data is a fallback, seed/reference data, or dead code, then make that policy explicit.
8. **`rememberMe` is not functional.** Either implement session-only behavior or remove the unused state/control.
9. **Google Maps effect lifecycle is incomplete.** Map and marker listeners/instances are not fully cleaned up when the component unmounts or dependencies change.
10. **Some map UI values are hard-coded for Indore.** Categories, labels, reset-north center, default search text, fallback map image, and counts are not fully derived from the selected district or API content.

### Low priority / maintenance

11. `vite.config.ts` uses `__dirname`; update to a Vite-compatible path strategy before the native config loader becomes default.
12. `App.tsx` uses an empty-object cast for initial selected state/district/site values. This avoids null checks but can hide invalid pre-load access.
13. `App` dependency arrays intentionally omit functions such as `refreshPublishedDirectory`; review with the React version/team conventions before refactoring.
14. Remote images and fonts have no local fallback asset strategy beyond the map fallback.

## 11. Environment and Commands

From the `Website/` directory:

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

The dev script starts Vite on port `3000` and binds to `0.0.0.0`:

```text
http://localhost:3000
```

Recommended `.env.local` values:

```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

Do not commit real API keys.

The backend is started separately from `backend/` with:

```powershell
npm install
npm start
```

The backend defaults to port `8080`. Its database and admin/user setup depend on the backend environment configuration; inspect `backend/.env.example` and the backend source before attempting production-like startup.

## 12. Suggested Next Work Sequence

1. Decide whether the modular backend stubs or the previous monolithic backend implementation is authoritative.
2. Implement and test the backend endpoints required by `src/api.ts`.
3. Remove the hard-coded Google Maps key and document environment setup.
4. Replace the stale Website README with current project instructions.
5. Add loading/error states to App and AuthPage for unavailable backend data.
6. Add frontend smoke tests for landing, auth, directory selection, profile update, favorites, and map fallback.
7. Resolve whether legacy static datasets remain as fallback/reference data.
8. Re-run `npm run lint`, `npm run build`, and end-to-end tests after backend integration.

## 13. Guidance for the Next AI

- Read this file before editing the Website.
- Preserve the API shapes in `src/api.ts` unless the backend contract is intentionally changed everywhere.
- Treat `App.tsx` as the current source of truth for view transitions and auth gating.
- Do not assume static data arrays are the active data source.
- Do not expose or reproduce the hard-coded Google key; remove it during the next map-related change.
- Before declaring a runtime fix complete, run both `npm run lint` and `npm run build`, then verify the backend is actually running and returning non-501 responses for the required endpoints.
