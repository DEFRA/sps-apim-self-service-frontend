# SPS APIM Self-Service Frontend

## Run
1. For local development, the proxy forwards `/api` and `/health` to https://localhost:57719 (update proxy.conf.json to use a different local API).
2. Run `npm install`.
3. Run `npm start`.
4. Open the Angular URL printed by the CLI.

The deployment startup script reads `API_BASE_URL` from the frontend App Service settings and writes it to a runtime configuration file. Set that setting to the API origin for each environment. Angular uses it for `/api` requests; the value is visible in the browser, so it must not contain credentials or other secrets. The API must allow credentialed CORS requests from the frontend origin. Authentication remains an HttpOnly Identity cookie and CSRF uses GET `/api/auth/csrf` + `X-XSRF-TOKEN`.

## Tests

Run the Angular unit tests with `npm test`. Tests use Angular's unit-test builder and Vitest.

## Deployment

The Azure DevOps pipeline in [azure-pipelines.yml](./azure-pipelines.yml) builds and deploys the Angular SPA using a shared deployment template. The deployment environment and promotion rules are configured in the pipeline. The build runs `npm ci` and `npm run build`, then packages and deploys the SPA to the selected Linux App Service.
