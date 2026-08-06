# Package Journey Visualizer (`track_pkg`)

## Overview
**Package Journey Visualizer** is a web-based application designed to track and visually depict the journey of packages shipped via major logistics carriers:
- **FedEx**
- **UPS**
- **USPS**
- **DHL**

Instead of reading raw, plain-text tracking status lists, users can view an interactive map and timeline depicting key milestones, transfer points, estimated delivery windows, and weather/delay alerts along the shipping route.

---

## Core Features & Vision

### 1. Multi-Carrier Support & Detection
- Automatically detect the carrier from standard tracking number formats or allow manual carrier selection.
- Unified data model normalizing status events across different carrier APIs/scraping layers.

### 2. Interactive Map & Journey Route
- Plot package checkpoints (origin, hub facilities, sorting centers, destination) on an interactive map.
- Dynamic route lines showing completed legs, in-transit segments, and final delivery destination.

### 3. Timeline & Milestone Tracker
- Visual step-by-step timeline of package movements with timestamps, location details, and status badges (e.g., *Picked Up*, *In Transit*, *Out for Delivery*, *Delivered*, *Exception/Delay*).
- Progress bar estimating completion percentage and remaining transit time.

### 4. Smart Insights & Alerts
- Weather and disruption overlay along the route.
- Delivery window predictions and notifications.
- History log for tracking multiple active packages in a single dashboard.

---

## Project Structure (Planned)

```text
track_pkg/
├── README.md               # Project overview and idea description
└── ... (Source code to be added)
```

---

## Getting Started
To set `track_pkg` as your active workspace in Antigravity IDE, open the folder `/Users/boolean/Dev/track_pkg`.
