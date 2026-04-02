# Universal SAR Application — Wireframe Descriptions

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## Design System: Glassmorphism Dark UI

All screens share a consistent design language built on a dark glassmorphism aesthetic with warm amber/gold accents. No cool blues are used anywhere in the interface.

**Color Palette:**
- Background: Deep charcoal (#0a0a0a) with subtle warm gradient
- Glass panels: rgba(255, 255, 255, 0.05) with backdrop-blur(16px)
- Primary accent: Warm amber (#f59e0b)
- Secondary accent: Deep gold (#d97706)
- Success: Warm green (#84cc16)
- Warning: Orange (#f97316)
- Danger: Warm red (#ef4444)
- Text primary: Warm white (#fafaf9)
- Text secondary: Warm gray (#a8a29e)
- Borders: rgba(245, 158, 11, 0.15)

**Component Patterns:**
- All panels use backdrop-blur(16px) with subtle amber-tinted borders
- Cards have rounded-xl corners with warm shadow glow on hover
- Buttons use amber gradient fills with glass-effect hover states
- Input fields have glass backgrounds with amber focus rings
- Navigation uses glass sidebar with amber active indicators

---

## Screen 1: Dashboard (Home)

**Layout:** Sidebar navigation (left, 280px) + Main content area

**Sidebar Navigation:**
- App logo and title "Universal SAR" at top
- Navigation items with Lucide icons: Dashboard, Active Searches, New Search, Subjects, Teams, Evidence, Analytics, Settings
- User profile section at bottom with role badge
- Glass panel with amber active state indicator

**Main Content — Dashboard:**
- **Top bar:** Search input, notification bell, accessibility mode toggle, user avatar
- **Stats row (4 cards):** Active Searches (count), Teams Deployed (count), Subjects Located (count), Avg Response Time
- **Active Operations panel (glass card, 60% width):** Table of active search operations showing operation name, subject type icon, status badge, probability score, teams assigned, last update time. Each row is clickable to open the operation detail.
- **Recent Activity panel (glass card, 40% width):** Timeline feed of recent events — sightings reported, probability updates, team check-ins, status changes. Each entry has timestamp, icon, and brief description.
- **Map Preview (full width, below):** Small interactive map showing all active search zones as colored overlays. Click any zone to navigate to that operation's map view.

---

## Screen 2: Active Searches List

**Layout:** Sidebar + Main content with filter bar

**Filter Bar:** Subject type dropdown, status dropdown (Active/Suspended/Closed/Cold Case), date range picker, search text input, sort options (newest, priority, last updated)

**Search Cards Grid:** Each active search displayed as a glass card containing:
- Subject photo/icon (type-specific default if no photo)
- Subject name and type badge
- Operation name and ID
- Status badge (color-coded)
- Current probability score (percentage with progress ring)
- Teams assigned count
- Time elapsed since start
- Last sighting time
- Quick action buttons: View Map, Update, Assign Team

---

## Screen 3: New Search Operation Wizard

**Layout:** Sidebar + Centered wizard panel (max-width 800px)

**Step 1 — Subject Type Selection:**
Four large glass cards in a 2x2 grid, each with an icon, title, and description:
- Human (person icon): Missing persons, lost hikers, fugitives, children
- Animal (paw icon): Lost pets, wildlife, livestock
- Vehicle (car icon): Stolen vehicles, abandoned vehicles, fleet tracking
- Object (box icon): Equipment, valuables, evidence items

**Step 2 — Subject Details (adapts by type selected):**
For Human: Name, age, gender, height, weight, physical description, photo upload, medical conditions, behavioral notes, clothing, equipment carried, experience level, fitness level
For Animal: Species, breed, name, color/markings, weight, temperament, training level, microchip ID, collar description, photo upload
For Vehicle: Make, model, year, color, license plate, VIN, fuel level, GPS tracker, distinguishing features, photo upload
For Object: Description, dimensions, weight, serial number, value, photo upload, tracking info

All fields marked as Required or Optional with clear visual indicators. Optional fields are collapsible sections.

**Step 3 — Last Known Information:**
- Last Known Position: Map picker (click to place pin) OR address input OR GPS coordinates
- Time last seen: Date/time picker
- Direction of travel (if known): Compass selector
- Circumstances: Free text with suggested tags (voluntary departure, involuntary, accident, unknown)
- Weather at time: Auto-populated from NOAA if date/location provided, with manual override
- Additional anchor points: Add multiple known locations (home, work, friend's house, etc.)

**Step 4 — Search Parameters:**
- Search area type: Convex Hull (auto), Circle, Custom polygon
- Maximum search radius (auto-calculated from subject type + conditions, with manual override)
- Priority level: Critical, High, Medium, Low
- Environment: Urban, Suburban, Wilderness, Maritime, Mountain, Desert
- Terrain notes: Free text
- Initial team assignment: Select from available teams

**Step 5 — Review & Launch:**
- Summary of all entered data in organized sections
- Preview map showing initial probability zones
- Confirm and launch button (amber gradient, prominent)
- Save as draft option

---

## Screen 4: Search Operation Detail — Map View

**Layout:** Sidebar + Full-screen map with overlay panels

**Map (Leaflet.js + OpenStreetMap):**
- Full viewport map with probability zone overlay (heatmap gradient from amber to red)
- Convex hull boundary displayed as dashed amber line
- Sighting markers (amber pins with timestamp labels)
- Team position markers (green dots with team name labels)
- Evidence markers (red triangles)
- Terrain hazard markers (orange warning icons)
- Layer toggle controls (top-right): Probability zones, Sightings, Teams, Evidence, Terrain, Weather

**Left Overlay Panel (glass, collapsible, 350px):**
- Subject summary card (photo, name, type, status)
- Probability score (large number with trend indicator)
- Quick stats: Time elapsed, area searched, sightings count
- Action buttons: Report Sighting, Update Probability, Deploy Team, Add Evidence

**Right Overlay Panel (glass, collapsible, 300px):**
- Timeline feed of operation events
- Filter by event type
- Each event shows time, type icon, description, and who reported it

**Bottom Panel (glass, collapsible, 200px):**
- Team status cards (horizontal scroll): Each team shows name, status (deployed/standby/returning), current zone, last check-in time
- Resource allocation summary

---

## Screen 5: Report Sighting Dialog

**Layout:** Modal overlay (glass panel, centered, 600px wide)

**Fields:**
- Location: Map pin placement OR GPS coordinates OR address
- Time of sighting: Date/time picker (defaults to now)
- Confidence level: Slider (1–10) with labels (Uncertain → Confirmed)
- Description: Free text area
- Photo/evidence upload: Drag-and-drop zone
- Reporter information: Name, contact, relationship to search
- Sighting type: Visual, Auditory, Physical evidence, Electronic signal, Scent detection
- Submit button triggers Bayesian probability update

---

## Screen 6: Subject Registration (Standalone)

**Layout:** Sidebar + Form panel

Similar to Wizard Step 2 but as a standalone page for pre-registering subjects outside of an active search operation. Includes additional fields for case reference numbers, agency contacts, and historical data.

---

## Screen 7: Team Management

**Layout:** Sidebar + Main content

**Team List:** Glass cards for each team showing:
- Team name and ID
- Team type badge (Ground, K9, Aerial, Marine, Technical, GPR)
- Member count
- Current status (Available, Deployed, Off-duty)
- Current assignment (if deployed)
- Equipment list
- Contact information

**Team Detail Panel (slides in from right):**
- Team member list with roles
- Equipment inventory
- Deployment history
- Current location on mini-map
- Communication log

**Create Team Dialog:** Name, type, members (searchable multi-select), equipment checklist, notes

---

## Screen 8: Evidence Management

**Layout:** Sidebar + Main content with grid/list toggle

**Evidence Grid:** Thumbnail cards for each evidence item showing:
- Preview image (or file type icon)
- Title and description
- Associated search operation
- Date collected
- Evidence type badge (Photo, Document, Physical, Digital, Forensic)
- Chain of custody indicator

**Evidence Detail Panel:**
- Full-size image/document viewer
- Metadata (date, location, collector, type)
- Chain of custody log
- Associated sightings and probability updates
- Notes and annotations
- Download/export options

**Upload Dialog:** Drag-and-drop zone, metadata form, operation association selector

---

## Screen 9: Analytics & Reporting

**Layout:** Sidebar + Main content with tab navigation

**Tab 1 — Overview:**
- Key metrics cards: Total operations, Success rate, Average time to locate, Active operations
- Operations by subject type (donut chart)
- Operations over time (line chart)
- Success rate by environment type (bar chart)

**Tab 2 — Search Patterns:**
- Probability accuracy analysis (predicted vs actual location)
- Movement pattern analysis by subject type
- Environmental factor correlation charts
- Terrain impact analysis

**Tab 3 — Team Performance:**
- Team deployment frequency
- Area coverage rates
- Response time analysis
- Resource utilization

**Tab 4 — Export:**
- Report template selector (Summary, Detailed, Forensic, Statistical)
- Date range filter
- Format selector (PDF, CSV, JSON)
- Generate and download button

---

## Screen 10: Settings

**Layout:** Sidebar + Settings panel with sub-navigation

**Sub-sections:**
- **Profile:** User name, email, role, notification preferences
- **System:** Default map center, default search radius, units (metric/imperial), timezone
- **Accessibility:** Mode selector (Standard, WCAG AAA, ADHD-Friendly, Dyslexic, Neuro, ECO CODE, No Blue Light) with live preview
- **Data Sources:** NOAA API status, USGS API status, OpenStreetMap status, connection test buttons
- **About:** Version, copyright (Freedom Angel Corp), FOSS attributions, changelog link
