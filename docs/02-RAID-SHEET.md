# Universal SAR Application — RAID Sheet

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## Risks

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R-01 | Incomplete subject data leads to inaccurate probability zones | High | High | Design algorithms to degrade gracefully with partial data; use Bayesian priors from Lost Person Behavior statistics when specific data is missing | Algorithm Team |
| R-02 | NOAA/USGS API rate limits or downtime during active search | Medium | High | Cache weather and elevation data locally; implement fallback to last-known-good data; queue requests with exponential backoff | Backend Team |
| R-03 | Map rendering performance degrades with large probability grids | Medium | Medium | Use Web Workers for probability calculations; implement LOD (Level of Detail) for zoom-dependent rendering; tile probability overlays | Frontend Team |
| R-04 | GPS accuracy insufficient for precise search zone delineation | High | Medium | Display confidence intervals on all GPS-derived boundaries; allow manual adjustment of anchor points; support multiple coordinate input methods | UX Team |
| R-05 | Snow bridge physics model oversimplifies real-world conditions | Medium | High | Clearly label all forensic calculations as estimates; include sensitivity analysis; allow parameter override by field experts | Algorithm Team |
| R-06 | Multi-user concurrent editing of same search operation | Medium | Medium | Implement optimistic locking on search operations; use timestamps for conflict detection; show real-time status of other editors | Backend Team |
| R-07 | Evidence files exceed storage limits | Low | Medium | Use S3 storage with CDN; enforce file size limits with clear user feedback; implement compression for images | Infrastructure |
| R-08 | Algorithm outputs misinterpreted by non-technical field operators | High | High | Provide plain-language explanations alongside all probability outputs; include ADHD-friendly visual summaries; add contextual help tooltips | UX Team |
| R-09 | Legal liability from incorrect probability zone guidance | Medium | Critical | Include prominent disclaimers; log all algorithm inputs/outputs for audit; never present outputs as certainty — always as probability ranges | Legal/Compliance |
| R-10 | Third-party API changes break weather/elevation integration | Low | Medium | Abstract all external APIs behind adapter interfaces; version-pin API contracts; maintain manual data entry fallback | Backend Team |

---

## Assumptions

| ID | Assumption | Validated | Impact if Wrong |
|----|-----------|-----------|-----------------|
| A-01 | Users have reliable internet connectivity in the field | No | Offline mode would be required; current architecture assumes connectivity for map tiles and API calls |
| A-02 | OpenStreetMap provides sufficient detail for SAR operations | Partially | May need to supplement with satellite imagery or custom tile layers for remote wilderness areas |
| A-03 | Lost Person Behavior statistics (Koester data) are applicable across geographic regions | Yes (published research) | Regional behavioral differences may require calibration; system allows manual override of statistical defaults |
| A-04 | NOAA weather API provides adequate temporal resolution for SAR | Yes | Hourly data is sufficient for most SAR operations; sub-hourly data would require additional weather station integration |
| A-05 | MySQL/TiDB can handle the geospatial query load without PostGIS | Partially | Complex geospatial queries may need optimization; Turf.js handles client-side geometry; server-side uses bounding box pre-filtering |
| A-06 | Single-page application architecture is suitable for field use | No | Field operators may prefer native mobile apps; PWA capabilities can bridge this gap in future iterations |
| A-07 | Admin user (angelreporters@gmail.com) will be the primary system administrator | Yes | Role-based access control supports multiple admin accounts if needed |
| A-08 | All subject types (human, animal, vehicle, object) can share a polymorphic data model | Yes | JSON attributes column provides unlimited flexibility per subject type while maintaining query efficiency on common fields |
| A-09 | Convex hull is the appropriate primary search boundary method | Yes (SAR standard practice) | Some scenarios (maritime, aerial) may require circular or sector-based boundaries; system supports multiple boundary types |
| A-10 | Users will input data in real-time during search operations | Partially | System also supports retrospective data entry for cold case analysis (e.g., Ryan Shtuka case) |

---

## Issues

| ID | Issue | Status | Priority | Resolution |
|----|-------|--------|----------|------------|
| I-01 | No offline capability for field use without internet | Open | Medium | Planned for future iteration — PWA with service worker caching of map tiles and local data sync |
| I-02 | Leaflet.js does not natively support 3D terrain visualization | Open | Low | Use elevation profile charts alongside 2D map; 3D visualization planned for future iteration with Three.js/Cesium |
| I-03 | No native mobile app for field operators | Open | Medium | Responsive web design provides mobile access; native app planned for future iteration |
| I-04 | Weather data limited to NOAA coverage (primarily US) | Open | Medium | International searches require manual weather input or integration with regional weather services (Environment Canada, Met Office, etc.) |
| I-05 | No real-time push notifications in initial release | Open | Low | Polling-based updates in v1; WebSocket/SSE push planned for next iteration |

---

## Dependencies

| ID | Dependency | Type | Status | Impact if Unavailable |
|----|-----------|------|--------|----------------------|
| D-01 | OpenStreetMap tile servers | External Service | Available | Map display fails; fallback to cached tiles or alternative tile provider (Stamen, CartoDB) |
| D-02 | NOAA Weather API (api.weather.gov) | External API | Available | Weather-adjusted probability calculations use default values; manual weather entry available |
| D-03 | USGS/OpenTopoData Elevation API | External API | Available | Terrain analysis uses flat-terrain defaults; manual elevation input available |
| D-04 | Turf.js library | NPM Package | Available | Geometric calculations would need custom implementation |
| D-05 | Leaflet.js library | NPM Package | Available | Map rendering would need alternative library (OpenLayers, Mapbox GL) |
| D-06 | MySQL/TiDB database | Infrastructure | Available | Application cannot persist data; in-memory mode for development only |
| D-07 | S3-compatible storage | Infrastructure | Available | Evidence file upload disabled; metadata-only mode |
| D-08 | Manus OAuth | Platform Service | Available | Authentication disabled; single-user mode |
| D-09 | Lost Person Behavior statistical data | Reference Data | Embedded | Movement prediction falls back to generic distance-based models |
| D-10 | Snow bridge forensic code (Python) | Existing Code | Available | Ported to TypeScript for integration; Python version maintained as reference |
