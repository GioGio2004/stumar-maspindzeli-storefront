# Stumar Maspindzeli · Guest storefront

The in-room guest app for the Gino pilot: room requests, water park, spa,
dining, concierge and stay info, as an animated bento of expandable cards.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_CONVEX_URL of the shared deployment
npm run dev                  # http://localhost:3100
```

- `/` shows the hotel in `NEXT_PUBLIC_HOTEL_SLUG` in browse mode. `/h/<slug>` shows any hotel.
- `/r/<token>` is what a room's NFC tag opens. The token is resolved in Convex.
  Unknown or disabled tokens show the "link isn't active" screen.

## Backend

The Convex backend lives in the admin repo (`../stumarmaspindzeli`). This app
only has a generated, typed copy of its public API in `lib/convex/api.ts`.
Refresh it from the admin repo after backend changes:

```bash
cd ../stumarmaspindzeli
npm run api:sync
```
