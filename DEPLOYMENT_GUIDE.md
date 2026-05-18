# DEPLOYMENT_GUIDE.md

## Purpose
Production deployment checklist and runbook for shipping Universal SAR through proper operational channels.

## 1) Pre-Deployment Requirements
- [ ] Environment variables configured (`DATABASE_URL`, `JWT_SECRET`, `VITE_APP_ID`, optional `TERRAIN_API_URL`)
- [ ] Database migrations generated and applied
- [ ] Python terrain API dependencies installed and health endpoint validated
- [ ] Baseline quality checks pass: `pnpm check`, `pnpm test`, `pnpm build`

## 2) Build & Validate
```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

## 3) Runtime Topology
- Node app serves API + frontend bundle (`dist/index.js` + `dist/public`).
- Python terrain service runs separately (default `http://localhost:5001`).
- MySQL/TiDB holds core operations and SAR analytics state.

## 4) Deployment Steps
1. Provision infrastructure (Node runtime, Python runtime, MySQL/TiDB).
2. Set environment secrets in deployment platform.
3. Deploy Node build artifact from `dist/`.
4. Deploy Python service from `python-backend/api_server.py`.
5. Run database migration job.
6. Execute smoke tests:
   - `GET /health` on Python service
   - app loads at `/`
   - create operation flow succeeds
   - terrain analysis trigger returns/stores results

## 5) Release Gating
A release is considered ship-ready only when:
- [ ] All CI checks pass (typecheck, tests, build)
- [ ] Deployment smoke tests pass
- [ ] Rollback plan and backup verified
- [ ] Label set applied (see `MARKET_LABELS.md`)
- [ ] Changelog entry prepared

## 6) Rollback
1. Revert to previous app image/build.
2. Point traffic to last healthy deployment.
3. Restore database snapshot only if backward-incompatible migration caused impact.
4. Communicate incident + corrective action to stakeholders.
