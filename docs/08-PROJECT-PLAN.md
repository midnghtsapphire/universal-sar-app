# Universal SAR Application — Project Plan (WBS with Dependencies)

**All Rights Reserved. Copyright 2010–2026 Freedom Angel Corp / Audrey Evans.**

---

## Work Breakdown Structure

| ID | Task | Predecessor | Estimate | Owner | Status |
|----|------|-------------|----------|-------|--------|
| **1.0** | **Foundation** | — | — | — | — |
| 1.1 | Define database schema (drizzle/schema.ts) | — | 4h | Backend | Done |
| 1.2 | Generate and apply migrations | 1.1 | 1h | Backend | Done |
| 1.3 | Create database query helpers (server/db.ts) | 1.2 | 3h | Backend | Done |
| 1.4 | Configure authentication and RBAC | — | 2h | Backend | Done |
| **2.0** | **API Layer** | — | — | — | — |
| 2.1 | Subject CRUD procedures | 1.3 | 3h | Backend | Done |
| 2.2 | Search operation CRUD procedures | 1.3, 2.1 | 3h | Backend | Done |
| 2.3 | Sighting reporting procedures | 2.2 | 2h | Backend | Done |
| 2.4 | Team management procedures | 1.3 | 2h | Backend | Done |
| 2.5 | Evidence management procedures | 2.2 | 2h | Backend | Done |
| 2.6 | Probability calculation procedures | 2.2, 3.2 | 3h | Backend | Done |
| 2.7 | Analytics/reporting procedures | 2.2 | 2h | Backend | Done |
| 2.8 | Weather integration procedures | 1.3 | 2h | Backend | Done |
| **3.0** | **Algorithm Engine** | — | — | — | — |
| 3.1 | Convex hull calculation (Graham Scan) | — | 3h | Algorithm | Done |
| 3.2 | Bayesian probability mapping | 3.1 | 4h | Algorithm | Done |
| 3.3 | Movement prediction by subject type | — | 3h | Algorithm | Done |
| 3.4 | Terrain/weather impact analysis | 3.2 | 3h | Algorithm | Done |
| 3.5 | Lost Person Behavior statistics data | — | 2h | Algorithm | Done |
| 3.6 | Snow bridge physics (port from Python) | — | 2h | Algorithm | Done |
| 3.7 | Path of least resistance calculation | 3.1, 3.4 | 3h | Algorithm | Done |
| 3.8 | Maximum travel radius calculation | 3.3, 3.5 | 2h | Algorithm | Done |
| **4.0** | **Frontend — Theme & Layout** | — | — | — | — |
| 4.1 | Glassmorphism dark theme (index.css) | — | 2h | Frontend | Done |
| 4.2 | Dashboard layout with sidebar | 4.1 | 2h | Frontend | Done |
| 4.3 | Navigation structure and routing | 4.2 | 1h | Frontend | Done |
| **5.0** | **Frontend — Pages** | — | — | — | — |
| 5.1 | Dashboard home page | 4.3, 2.2 | 3h | Frontend | Done |
| 5.2 | Active searches list page | 4.3, 2.2 | 2h | Frontend | Done |
| 5.3 | New search wizard (4 steps) | 4.3, 2.1, 2.2 | 4h | Frontend | Done |
| 5.4 | Search operation detail / map view | 5.3, 2.6 | 4h | Frontend | Done |
| 5.5 | Sighting report dialog | 5.4, 2.3 | 2h | Frontend | Done |
| 5.6 | Team management page | 4.3, 2.4 | 2h | Frontend | Done |
| 5.7 | Evidence management page | 4.3, 2.5 | 2h | Frontend | Done |
| 5.8 | Analytics page | 4.3, 2.7 | 3h | Frontend | Done |
| 5.9 | Settings page with accessibility modes | 4.3 | 2h | Frontend | Done |
| **6.0** | **Map Integration** | — | — | — | — |
| 6.1 | Leaflet.js map component | 4.1 | 2h | Frontend | Done |
| 6.2 | Probability zone overlay rendering | 6.1, 3.2 | 3h | Frontend | Done |
| 6.3 | Sighting markers layer | 6.1 | 1h | Frontend | Done |
| 6.4 | Team position markers layer | 6.1 | 1h | Frontend | Done |
| 6.5 | Convex hull boundary display | 6.1, 3.1 | 1h | Frontend | Done |
| **7.0** | **Testing & Quality** | — | — | — | — |
| 7.1 | Algorithm unit tests | 3.1–3.8 | 3h | QA | Done |
| 7.2 | API integration tests | 2.1–2.8 | 3h | QA | Done |
| 7.3 | Accessibility audit | 5.9 | 2h | QA | Done |
| **8.0** | **Documentation** | — | — | — | — |
| 8.1 | Project roadmap | — | 1h | PM | Done |
| 8.2 | RAID sheet | — | 1h | PM | Done |
| 8.3 | Use cases | — | 2h | PM | Done |
| 8.4 | Wireframes | — | 2h | Design | Done |
| 8.5 | Data dictionary | 1.1 | 2h | Backend | Done |
| 8.6 | Pseudo code | 3.1–3.8 | 2h | Algorithm | Done |
| 8.7 | Resources list | — | 1h | PM | Done |

---

## Dependency Graph (Critical Path)

```
1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 2.6 → 5.4 (Map View)
                              ↘ 2.3 → 5.5 (Sighting Dialog)
                    ↘ 2.4 → 5.6 (Teams)
                    ↘ 2.5 → 5.7 (Evidence)

3.1 → 3.2 → 3.4 → 3.7 (Path of Least Resistance)
       ↘ 2.6 → 5.4 (Map View with Probability)
3.3 → 3.8 (Max Travel Radius)
3.5 → 3.3 (Movement uses LPB data)

4.1 → 4.2 → 4.3 → 5.1–5.9 (All pages)
                  → 6.1 → 6.2–6.5 (Map layers)
```

The **critical path** runs through: Schema → Migrations → DB Helpers → Subject API → Operation API → Probability API → Map View Page. This chain determines the minimum project duration.
