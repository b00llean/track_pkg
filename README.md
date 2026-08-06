# Package Journey Visualizer (`track_pkg`)

**Package Journey Visualizer** is a modern geospatial web application designed to track and visually depict the end-to-end journey of packages shipped via major logistics carriers (**FedEx**, **UPS**, **USPS**, **DHL**).

Instead of plain-text tracking status lists, users view an interactive OpenStreetMap geospatial map and step-by-step milestone timeline featuring transfer hubs, transit durations, weather disruption alerts, and delivery predictions.

---

## Key Features & Highlights

- **Geospatial Route Map (Leaflet / OpenStreetMap)**:
  - 90% end-to-end auto-fit map view fitting full route bounds smoothly.
  - Aligned transit line duration midpoint badges with vector clock icons centered inside underground circles.
  - Interactive marker pins with glowing pulse halos and detailed popup cards.
- **Timeline-to-Map Synchronization**:
  - Clicking any stop in the **Journey Milestone Timeline** triggers a smooth `flyTo` camera repositioning to the pin's coordinates and opens its popup card.
  - Clean unselected default state on page load.
- **Multi-Carrier Automatic Detection**:
  - Supports FedEx, UPS, USPS, DHL tracking numbers with demo presets and custom text import modal.
- **Local Package History**:
  - Save and pin multiple active packages to track in a single dashboard drawer.
- **Docker & TrueNAS SCALE Container Ready**:
  - Production-ready Dockerfile (multi-stage build), `docker-compose.yml`, and `nginx.conf` included.

---

## Project Structure

```text
track_pkg/
├── Dockerfile              # Multi-stage container build (Node 20 -> Nginx Alpine)
├── docker-compose.yml      # Container compose configuration for TrueNAS SCALE / Docker
├── nginx.conf              # SPA routing fallback Nginx configuration
├── index.html              # App entrypoint
├── package.json            # Project dependencies & scripts
├── src/
│   ├── components/
│   │   ├── InteractiveMap.tsx      # Geospatial Leaflet map & route renderer
│   │   ├── JourneyTimeline.tsx     # Step-by-step milestone timeline
│   │   ├── PackageSummaryCard.tsx  # Hero tracking summary & progress bar
│   │   ├── PackageHistoryDrawer.tsx # Drawer for saved package history
│   │   ├── ImportTrackingModal.tsx  # Custom text import modal
│   │   ├── TrackingSearch.tsx      # Carrier detection search input
│   │   └── Navbar.tsx              # Navigation bar header
│   ├── services/
│   │   ├── carrierDetector.ts      # Regex carrier pattern matcher
│   │   ├── geocoding.ts            # Coordinate resolver
│   │   └── trackingService.ts      # Multi-carrier mock API service
│   ├── types/
│   │   └── tracking.ts             # Data models & TypeScript interfaces
│   ├── App.tsx                     # Main application layout & state
│   ├── main.tsx                    # React DOM root entry
│   └── index.css                   # TailwindCSS & Leaflet theme styling
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```

---

## TrueNAS SCALE & Docker Deployment

### Using Docker Compose
```bash
docker compose up -d --build
```
Access the application at `http://<SERVER-IP>:8080`.
