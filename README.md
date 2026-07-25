# JakshWealth UI

Angular **21** frontend for personal NSE stock analysis. Deployed with **jakshwealth-infra** (S3 + CloudFront) and **jakshwealth-api** (`/jw-api/`).

## Local dev

```bash
npm install
npm start
```

Copy `src/environments/environment.development.example.ts` → `environment.development.ts` and set your Okta client ID.

## Deploy

Jenkins pipeline: `.cicd/Jenkinsfile` — build Angular, sync to S3, invalidate CloudFront.
