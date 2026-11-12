# StackRoast

StackRoast is an anonymous developer feedback and code-review platform built with MongoDB, Express, React, Vite, Node.js, Tailwind CSS, and JWT authentication.

## Features

- Public feed with debounced search, tag filters, active/expired views, and newest / most-upvoted / expiring-soon sorting.
- Live `HH:MM:SS` expiry countdowns. Reply forms lock as soon as the deadline passes, even before the next server cron run.
- Authenticated post creation with 1h, 12h, 24h, or 48h expiry, optional demo URL, tech tags, code language, and an anonymity switch.
- Public API author masking for anonymous posts and comments. Ownership remains linked to the creator's internal MongoDB ObjectId and is never exposed in anonymous public responses.
- Copyable code blocks, post and comment upvotes, feedback-type labels, owner-only resolve/reopen, and owner-only post deletion with comment cascade.
- Persistent light / dark theme. The initial theme follows the OS preference; an explicit choice is persisted in `localStorage`.
- A minute cron job flags expired posts and purges expired posts plus their comments after the configurable retention period (30 days by default).
- Centralized JSON errors, auth rate limiting, Helmet headers, CORS allow-list, bcrypt password hashing, and JWT session restoration.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB 6 or newer (local or hosted)

## Setup

1. Install the root helper and both app dependencies:

   ```bash
   npm run install:all
   ```

   Alternatively, install separately with `npm install` in the root, `server`, and `client` directories.

2. Create `server/.env` from `server/.env.example` (or copy the server section from the root `.env.example`). Set `MONGODB_URI` and replace `JWT_SECRET` with a cryptographically random value of at least 32 characters.

3. Create `client/.env` from `client/.env.example`. Set `VITE_API_URL` to the public API base URL. For local development, the default is `http://localhost:5000/api`.

4. Start MongoDB. For a local MongoDB installation, the default URI is `mongodb://127.0.0.1:27017/stackroast`.

5. Start both apps from the project root:

   ```bash
   npm run dev
   ```

   Or run them separately:

   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

6. Open `http://localhost:5173`. The API health endpoint is `http://localhost:5000/api/health`.

## Production build and start

Build the frontend:

```bash
npm run build
```

Start the API in production:

```bash
cd server
npm start
```

Deploy the contents of `client/dist` to a static host and configure its `VITE_API_URL` at build time. Deploy the API separately and set `CLIENT_ORIGIN` to the exact deployed frontend origin(s), comma-separated if necessary. Use a managed MongoDB deployment, HTTPS, a strong unique JWT secret, and an appropriate retention setting.

## Environment variables

| Variable | Used by | Description |
|---|---|---|
| `NODE_ENV` | Server | `development` or `production` |
| `PORT` | Server | API port; defaults to `5000` |
| `MONGODB_URI` | Server | MongoDB connection string |
| `JWT_SECRET` | Server | Random secret, minimum 32 characters |
| `JWT_EXPIRES_IN` | Server | JWT lifetime; defaults to `7d` |
| `CLIENT_ORIGIN` | Server | CORS allow-list; comma-separated origins |
| `EXPIRED_RETENTION_DAYS` | Server | Days after expiry before posts and comments are purged; defaults to `30` |
| `VITE_API_URL` | Client | API base URL ending in `/api` |

## API overview

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)

### Posts

- `GET /api/posts?search=&tag=all&sort=newest&status=active`
- `GET /api/posts/:id`
- `POST /api/posts` (Bearer token required)
- `PATCH /api/posts/:id/upvote` (Bearer token required; toggles the caller's vote)
- `PATCH /api/posts/:id/resolve` (Bearer token required; owner only; toggles resolution)
- `DELETE /api/posts/:id` (Bearer token required; owner only; deletes comments too)
- `POST /api/posts/:id/comments` (Bearer token required; active posts only)

### Comments

- `PATCH /api/comments/:id/upvote` (Bearer token required; toggles the caller's vote)

All error responses use the JSON shape `{ "message": "..." }`. Public post and comment responses do not include `authorId` or the raw `upvotes` arrays. Anonymous authors are represented as `Anonymous Dev`; `isOwner` is computed server-side for the signed-in viewer.

## Data retention and anonymity notes

Anonymous identity is a presentation/privacy setting, not a separate account. The creator's `authorId` remains stored as a private ObjectId reference for Mongoose relations, while an HMAC-SHA256 fingerprint of that ID (using the server secret) is used for owner verification. Both values are excluded from public API responses. The API masks usernames when anonymity is enabled. This hides the public profile association but does not make the application immune to infrastructure-level access by database administrators or operators.

Expired records remain available in the expired feed for the configured retention window. After that window, the cron worker deletes both the post and its comments to keep storage bounded. Back up your database before changing retention settings in a production deployment.

## Notes

- The top feed is sorted server-side using the persisted upvote array count; one vote per account is enforced by `$addToSet` / `$pull` toggling.
- The feed returns up to 100 posts per request. For a large deployment, add cursor pagination and request throttling appropriate to your traffic profile.
- Use HTTPS in production so JWT bearer tokens are protected in transit.

## Admin dashboard

To bootstrap an administrator safely, add the intended email address to `ADMIN_EMAILS` in `server/.env` **before registering that account**. Example:

```env
ADMIN_EMAILS=you@example.com
```

Register using that exact email. Only allowlisted emails receive the `admin` role; public registration never accepts a role from the request body. Sign out and sign back in after changing an existing account's role. The Admin button appears in the navbar for admin accounts. The dashboard includes aggregate counts, recent posts, user listing, post resolution, and post deletion with comment cascade. All admin endpoints require a valid JWT and the server-side admin role.

For an existing account, do not edit the role from the browser. Set it through a trusted MongoDB Atlas admin operation or a one-time secured migration, then log in again. Keep `ADMIN_EMAILS` restricted and never commit `.env`.


## Responsive layout

The client uses a mobile-first layout for narrow phones (320px and up), larger phones, tablets, laptops and desktop displays. The navigation search moves below the primary actions on small screens; feed cards collapse to one column and expand at tablet/desktop breakpoints; post detail and creation dialogs scroll within the viewport; admin tabs remain horizontally scrollable and user records switch to compact cards on phones. Code blocks retain horizontal scrolling rather than forcing page-wide overflow. On iOS-sized screens form controls use a 16px font to avoid automatic zoom.

Recommended manual viewport checks: 320×568, 375×667, 390×844, 768×1024, 1024×768, 1366×768 and 1920×1080.
