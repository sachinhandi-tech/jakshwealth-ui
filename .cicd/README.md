# JakshWealth UI — CI/CD

Pipeline deploys the **jakshwealth-ui** Angular app to S3 + CloudFront provisioned by **jakshwealth-infra**.

## AWS credentials

Personal account: configure `aws configure --profile jakshwealth` on the build agent.
See `../jakshwealth-infra/docs/AWS_PERSONAL_SETUP.md` and `.cicd/build_props/*.properties`.

```bash
./scripts/verify-aws.sh
```

## Branch → environment

| Branch | `deploy_env` |
|--------|--------------|
| `main` / `master` | `prod` |
| `test` | `test` |
| other (e.g. `dev`) | `dev` |

## S3 / CloudFront (from jakshwealth-infra)

Buckets: `jakshwealth-ui-{env}` (see `s3-cloudfront-ssa/`)

Apply platform infra first:

```bash
cd jakshwealth-infra/s3-cloudfront-ssa/module
export AWS_PROFILE=jakshwealth
terraform init -backend-config=config/dev-backend.tfvars
terraform apply -var deploy_env=dev -var-file=s3_config_vars/s3.dev.tfvars
```

Then this UI pipeline syncs `dist/browser/` and invalidates CloudFront.

## API URL

Set `environment.*.ts` `url` to the JakshWealth API Gateway domain, e.g.:

`https://jw-api-g.jakshwealth-dev.example.com/jw-api/`

Set matching `FRONTEND_URL` in `{env}/jakshwealth/config` for CORS and Okta redirects.

CloudFront origin ID pattern: `S3-jakshwealth-ui-{env}`
