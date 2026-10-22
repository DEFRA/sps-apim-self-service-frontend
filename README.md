# SPS APIM Self-Service Frontend

## Run
1. Ensure the ASP.NET API is running on https://localhost:57719 (or update proxy.conf.json).
2. Run `npm install`.
3. Run `npm start`.
4. Open the Angular URL printed by the CLI.

The dev proxy keeps browser API requests same-origin while forwarding /api and /health to ASP.NET. Authentication remains an HttpOnly Identity cookie and CSRF uses GET /api/auth/csrf + X-XSRF-TOKEN.

## Deployment

The Azure DevOps pipeline in [azure-pipelines.yml](./azure-pipelines.yml) builds and deploys the Angular SPA using the shared job template from the `feature/Self-Serve-Portal` branch of `DEFRA-API-INFRA`. Select `dev2`, `tst1`, `pre1`, or `prd1` with the template's `environment` parameter. DEV2 deployments are enabled for the feature branch; TST1, PRE1, and PRD1 deployments require running the pipeline from `master`. The template runs `npm ci` and `npm run build`, then packages and deploys the Angular SPA to the selected Linux App Service.
