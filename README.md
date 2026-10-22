# SPS APIM Self-Service Frontend

## Run
1. Ensure the ASP.NET API is running on https://localhost:57719 (or update proxy.conf.json).
2. Run `npm install`.
3. Run `npm start`.
4. Open the Angular URL printed by the CLI.

The dev proxy keeps browser API requests same-origin while forwarding /api and /health to ASP.NET. Authentication remains an HttpOnly Identity cookie and CSRF uses GET /api/auth/csrf + X-XSRF-TOKEN.

## Deployment

The Azure DevOps pipeline in [azure-pipelines.yml](./azure-pipelines.yml) builds and deploys the Angular SPA using a shared deployment template. The deployment environment and promotion rules are configured in the pipeline. The build runs `npm ci` and `npm run build`, then packages and deploys the SPA to the selected Linux App Service.
