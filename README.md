# Package Journey Visualizer (`track_pkg`)

**Package Journey Visualizer** is a modern geospatial web application designed to track and visually depict the 100% real-time journey of packages shipped via major logistics carriers (**FedEx**, **UPS**, **USPS**, **DHL**, and 1,700+ global carriers).

Powered by the **17TRACK Live API (v2.2)** and **Leaflet / OpenStreetMap**, the application transforms raw tracking status events into an interactive geospatial route map, complete with milestone timeline cards, location hub grouping, transit duration indicators, weather disruption alerts, and delivery predictions.

---

## Key Features & Highlights

- **100% Live Package Tracking (17TRACK API v2.2)**:
  - Real-time tracking queries and automatic carrier registration across FedEx, UPS, USPS, DHL, and global logistics networks.
  - Seamless API key configuration via `.env` file (`VITE_17TRACK_API_KEY`) or the in-app Settings configuration modal with live connection testing.

- **Geospatial Route Map (Leaflet / OpenStreetMap)**:
  - Auto-bounding map container fitting the entire package journey.
  - Vector transit line duration midpoint badges with elapsed transit time indicators.
  - Interactive marker pins grouped by logistics facility type (Origin, Sorting Hub, Delivery Station, Destination) with pulse halos and detailed popup overlays.

- **Offline Logistics Hub Database & 50 US State Centroid Geocoder**:
  - Over 100+ major US logistics hubs, sorting facilities, and international gateways indexed for 0ms instant offline coordinate resolution.
  - Full 50 US state centroid fallbacks preventing arbitrary coordinate drift if OpenStreetMap rate limits occur.
  - Reverse proxy support (`/api/nominatim/`) to ensure browser CORS compliance.

- **Timeline-to-Map Synchronization**:
  - Clicking any stop in the **Journey Milestone Timeline** triggers a smooth camera flyTo animation to the location pin and opens its info popup card.

- **Multi-Carrier Automatic Detection & Custom Text Import**:
  - Auto-detects carrier formats via regex and provides a custom text importer for manual event timeline building.

- **Local Package History Drawer**:
  - Pin and persist active packages in `localStorage` for one-click access.

- **Docker, TrueNAS SCALE & Environment Runtime Ready**:
  - Includes multi-stage Dockerfile, `docker-compose.yml`, reverse proxy `nginx.conf`, and dynamic runtime environment variable injection (`window.__ENV__`).

---

## Quick Start with `./start.sh`

The included `./start.sh` script automates configuration validation, environment variable detection, and service startup.

```bash
# Make script executable (if needed)
chmod +x start.sh

# Run startup script
./start.sh
```

Choose your desired startup mode:
1. **Development Mode** (`./start.sh dev` or `npm run dev`): Starts Vite dev server at `http://localhost:3000`.
2. **Docker Container Mode** (`./start.sh docker` or `docker compose up -d --build`): Runs Nginx container at `http://localhost:8080`.

---

## Environment Variables (`.env`)

Copy `.env.example` to `.env` and enter your 17TRACK API Key (`17token`):

```bash
# .env
VITE_17TRACK_API_KEY=your_17track_api_key_here
```

> **Note**: Obtain a free 17token API key at [17TRACK API Portal](https://res.17track.net/en/api). You can also enter or update your key directly inside the app UI via the Settings gear icon.

---

## Project Structure

```text
track_pkg/
├── Dockerfile                  # Multi-stage container build (Node 20 -> Nginx Alpine)
├── docker-compose.yml          # Docker Compose configuration with env arg mapping
├── nginx.conf                  # Nginx configuration with /api/17track & /api/nominatim proxies
├── start.sh                    # Universal startup script with env verification
├── .env.example                # Template environment variables
├── index.html                  # App HTML entrypoint with env-config.js runtime script
├── package.json                # Project dependencies & scripts
├── public/
│   └── env-config.js           # Dynamic runtime environment injection
├── src/
│   ├── components/
│   │   ├── InteractiveMap.tsx       # Geospatial Leaflet map & route polyline renderer
│   │   ├── JourneyTimeline.tsx      # Step-by-step milestone timeline
│   │   ├── PackageSummaryCard.tsx   # Hero tracking summary & progress bar
│   │   ├── PackageHistoryDrawer.tsx # Drawer for saved package history
│   │   ├── ImportTrackingModal.tsx  # Custom text import modal
│   │   ├── SettingsModal.tsx        # 17TRACK API Key configuration & connection tester
│   │   ├── TrackingSearch.tsx       # Carrier detection search input & inline key banner
│   │   └── Navbar.tsx               # Navigation header bar
│   ├── services/
│   │   ├── carrierDetector.ts       # Carrier pattern regex detector
│   │   ├── geocoding.ts             # US hubs, state centroids & Nominatim geocoder
│   │   ├── liveTrackingService.ts   # 17TRACK v2.2 live API client & CORS proxy handler
│   │   └── trackingService.ts       # Main tracking fetch coordinator
│   ├── types/
│   │   └── tracking.ts              # Data models & TypeScript interfaces
│   ├── App.tsx                      # Main application layout & state management
│   ├── main.tsx                     # React DOM root entry
│   └── index.css                    # TailwindCSS & Leaflet custom styling
└── vite.config.ts               # Vite configuration with API proxies & envPrefix
```

---

## Local Development Commands

```bash
# Install dependencies
npm install

# Start Vite dev server (http://localhost:3000)
npm run dev

# Run TypeScript type check
npm run lint

# Build production static bundle
npm run build
```

---

## Docker & TrueNAS SCALE Deployment

```bash
# Build and start container background service
docker compose up -d --build
```
Access the application at `http://<SERVER-IP>:8080`.
