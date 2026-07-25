# JakshWealth UI — CI/CD

Personal Jenkins pipeline: build Angular → S3 sync → CloudFront invalidation.

## Jenkins job setup

| Setting | Value |
|---------|--------|
| Pipeline script | `Jenkinsfile` (repo root) or `.cicd/Jenkinsfile` |
| Agent | any (Node.js + AWS CLI on Jenkins server) |
| GitHub credentials | Required for private repo (PAT on `sachinhandi-tech`) |
| AWS | Jenkins credential `jakshwealth-aws` — see `../jakshwealth-infra/docs/JENKINS_SETUP.md` |

## Branch → environment

| Branch | `deploy_env` |
|--------|--------------|
| `main` | `prod` |
| `test` | `test` |
| other | `dev` |

## Prerequisites on Jenkins server

- Node.js 20+ and `npm`
- AWS CLI v2 with profile `jakshwealth`
- Platform infra applied first (`jakshwealth-infra` pipeline)

## Deploy order

1. **jakshwealth-infra** — S3 + CloudFront + API Gateway shell
2. **jakshwealth-api** — Lambdas + integrations
3. **jakshwealth-ui** — this pipeline
