# SPS APIM Self-Service Frontend

## Run
1. For local development, the Angular CLI proxy forwards `/api` and `/health` to https://localhost:57719 (update proxy.conf.json to use a different local API).
2. Run `npm install`.
3. Run `npm start`.
4. Open the Angular URL printed by the CLI.

The frontend App Service startup server reads `API_BASE_URL` as the backend origin and proxies `/api` and `/health` requests server-to-server. It forwards the original host in `X-Forwarded-Host`, sets `X-Forwarded-Proto: https`, and removes backend ARR affinity cookies while preserving application authentication cookies. The Angular app uses relative API paths and exposes no backend URL in browser runtime configuration. This keeps authentication and antiforgery cookies first-party on the frontend hostname, avoiding browser third-party-cookie restrictions. Keep `API_BASE_URL` set to the HTTPS backend origin; it must not contain credentials.

`GET /health/frontend` is a frontend-process liveness endpoint. It returns `200` without contacting the backend and is configured as the frontend App Service Health Check path. `GET /health/live` remains proxied to the backend for checking backend health through the frontend. A healthy frontend check does not guarantee that the backend is healthy.

## Tests

Run the Angular unit tests with `npm test`. Tests use Angular's unit-test builder and Vitest.

## Deployment

The Azure DevOps pipeline in [azure-pipelines.yml](./azure-pipelines.yml) builds and deploys the Angular SPA using a shared deployment template. The deployment environment and promotion rules are configured in the pipeline. The build runs `npm ci` and `npm run build`, then packages and deploys the SPA to the selected Linux App Service.
