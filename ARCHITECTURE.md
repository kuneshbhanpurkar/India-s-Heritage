# Dharohar — National Cultural Heritage & Monument CMS Platform
## Production System Architecture & Developer Documentation

---

## 1. High-Level Architecture Overview

Dharohar is a full-stack cultural preservation and heritage tourism system built on a city-isolated, dynamic 5-section Content Management System (CMS).

```text
┌──────────────────────────────┐              ┌──────────────────────────────┐
│       Admin CMS Portal       │              │        Public Website        │
│       (React 19 + Vite)      │              │       (React 19 + Vite)      │
│     http://localhost:3001    │              │     http://localhost:3000    │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               │ [Bearer JWT]                                │ [Public GET APIs]
               ▼                                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       Dharohar Express Backend Server                      │
│                    Canonical Entrypoint: src/server.js                     │
│                        App Engine: src/app.js                              │
│                         http://localhost:8080                              │
├────────────────────────────────────────────────────────────────────────────┤
│  Routes & Middleware:                                                      │
│  - /api/auth   : Admin Auth, JWT generation, bcrypt verification           │
│  - /api/users  : Citizen signup/login, onboarding default city             │
│  - /api/public : City metadata, 5-section queries, geospatial $near search │
│  - /api/admin  : requireAdminToken, City/Section-scoped CRUD, analytics    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                           MongoDB Atlas Cluster                            │
│  Collections:                                                              │
│  - states     : States with codes, locations, descriptions                 │
│  - districts  : Cities (aliased to districts) with coordinates             │
│  - places     : Heritage items strictly indexed by { cityId, section }     │
│  - users      : Admins and citizens with hashed passwords & default city   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Data Models & Relationships

### A. State Model (`models/State.js`)
```typescript
interface State {
  _id: ObjectId;
  name: string;              // e.g., "Madhya Pradesh"
  code: string;              // e.g., "MP" (uppercase, unique)
  slug: string;              // e.g., "madhya-pradesh"
  country_code: string;      // default: "IN"
  description: string;
  location: { type: "Point", coordinates: [lng, lat] };
  active: boolean;
}
```

### B. City Model (`models/City.js` / aliased to `District.js`)
```typescript
interface City {
  _id: ObjectId;             // Canonical unique city identifier
  stateId: ObjectId;         // Ref -> State
  name: string;              // e.g., "Indore"
  slug: string;              // e.g., "indore"
  coverImage?: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  active: boolean;
}
```

### C. The 5 Canonical Sections (`config/sections.js`)
Every city dynamically presents content organized into 5 standardized sections:
1. `popular-places` : Popular Places (Key monuments & landmarks)
2. `hidden-places` : Hidden Places (Lesser-known enclaves, stepwells)
3. `cultural-folk` : Cultural & Folk Music / Dance (Living performing arts)
4. `regional-festivals` : Regional Festivals (Annual fairs & sacred traditions)
5. `living-culture` : Living Culture (Bazaars, culinary heritage, crafts)

### D. Content / Heritage Place Model (`models/Content.js`)
```typescript
interface Content {
  _id: ObjectId;
  cityId: ObjectId;          // Strict foreign key to City (District)
  districtId?: ObjectId;     // Synchronized alias for backward compatibility
  stateId?: ObjectId;        // Foreign key to State
  section:                   // Validated against the 5 canonical sections
    | "popular-places"
    | "hidden-places"
    | "cultural-folk"
    | "regional-festivals"
    | "living-culture";
  title: string;
  slug: string;
  status: "draft" | "review" | "published" | "hidden";
  isFeatured: boolean;
  fields: {
    subTitle?: string;
    description?: string;
    builtYear?: string;
    dynasty?: string;
    openingHours?: string;
    rating?: number;
    reviewsCount?: string;
    visitorTariffs?: Array<{ category: string; price: string }>;
    transitOptions?: Array<{ mode: string; detail: string; etaMinutes?: number; fare?: string }>;
  };
  media: Array<{
    type: "image" | "video";
    url: string;
    alt?: string;
  }>;
  latitude: number;
  longitude: number;
  location: {
    type: "Point";
    coordinates: [longitude, latitude]; // GeoJSON format for 2dsphere indexing
  };
  active: boolean;
}
```

### E. Compound Database Indexes
To support high volumes of data without latency:
- `Content`: `{ cityId: 1, section: 1, status: 1 }` (Enforces zero data leakage and fast section filtering)
- `Content`: `{ location: "2dsphere" }` (Enforces rapid geospatial `$near` queries)
- `City`: `{ stateId: 1, name: 1 }` (Unique compound index)
- `User`: `{ email: 1 }` (Unique index)

---

## 3. Authentication & Role-Based Access Control (RBAC)

### Lifecycle:
1. **Admin Login**:
   - `POST /api/auth/login` with `{ email, password }`
   - Backend queries `User.findOne({ email, role: { $in: ['admin', 'super_admin', 'editor', 'reviewer'] } })`
   - Compares password using `bcrypt.compare(password, user.password)`
   - Signs JWT payload: `{ sub: user._id, role: user.role }` with `JWT_SECRET` (expires in 30 days)
   - Returns `{ token, admin: userProfile(user), user: userProfile(user) }`
2. **Admin Protection**:
   - Middleware `requireAdminToken` validates JWT signature.
   - If token is missing/expired: `401 Unauthorized`.
   - If token belongs to a citizen user (`role === 'user'`): `403 Forbidden`.
3. **Citizen User Onboarding & Location**:
   - `POST /api/users/register` saves `{ name, email, password, stateId, cityId }`.
   - The user's `cityId` becomes their default landing city.

---

## 4. City Isolation & Dynamic Section Routing

### Zero Cross-City Leakage Rule:
- When a user views Indore (`/cities/:indoreId`), all section queries on backend execute:
  ```javascript
  Content.find({ cityId: indoreId, section: sectionSlug, status: "published" })
  ```
- Jaipur, Ujjain, or Bhopal records can **never** appear on Indore because queries are strictly isolated by `cityId`.
- Draft, review, or hidden records are filtered out automatically on all public routes.

### Reusable UI Routing:
- **City Homepage**: `/cities/:cityId` renders `HomeDashboard` with dynamic greeting:
  `"Welcome to {cityName}, {userName}"`
- **Single Section View**: `/cities/:cityId/:sectionSlug` renders `CitySectionPage` dynamically for all 5 sections.

---

## 5. API Reference

### Public Endpoints (`/api/public/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/public/states` | List all active States |
| `GET` | `/api/public/states/:stateId/cities` | List active Cities in a State |
| `GET` | `/api/public/cities/:cityId` | Get metadata for a specific City |
| `GET` | `/api/public/cities/:cityId/sections` | 5-Section summary with card previews for City home |
| `GET` | `/api/public/cities/:cityId/sections/:sectionSlug` | Paginated card list for that City and Section |
| `GET` | `/api/public/content/:idOrSlug` | Detailed monograph information for a monument |
| `GET` | `/api/public/nearby?lat=...&lng=...&km=...` | Geospatial search for monuments around user's GPS |

### Admin Endpoints (`/api/admin/*` — Requires `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/summary` | Analytics & Coverage Ledger across all states/cities |
| `GET` | `/api/admin/content` | List content with filters (`stateId`, `cityId`, `section`, `status`, `search`) |
| `GET` | `/api/admin/content/:id` | Get single record by ID |
| `POST` | `/api/admin/content` | Create record strictly assigned to State, City, & Section |
| `PUT` | `/api/admin/content/:id` | City-safe update of record |
| `DELETE` | `/api/admin/content/:id` | Remove record from database |
| `GET` | `/api/admin/states` | List all States |
| `POST` | `/api/admin/states` | Create State |
| `GET` | `/api/admin/cities` | List all Cities |
| `POST` | `/api/admin/cities` | Create City |
| `PUT` | `/api/admin/cities/:id` | Update City |
| `GET` | `/api/admin/admins` | List Admin Officers |
| `POST` | `/api/admin/admins` | Create Admin Officer |

---

## 6. Running and Developing Locally

### Ports:
- **Backend API**: `8080` (`http://localhost:8080`)
- **Website Portal**: `3000` (`http://localhost:3000`)
- **Admin Portal**: `3001` (`http://localhost:3001`)

### Starting Services:
From `DHAROHAR/DHAROHAR`:
```bash
# Start Backend
npm run start:backend

# Start Public Website
npm run start:website

# Start Admin Dashboard
npm run start:admin
```

### Running Automated Test Suite:
From `DHAROHAR/DHAROHAR/backend`:
```bash
node tests/api.test.js
```
Runs 11 automated integration tests verifying authentication, role enforcement, city isolation, cross-city leakage prevention, draft hiding, and geospatial proximity queries.
