# jakshwealth-ui

Angular **21** frontend for **JakshWealth** stock analysis. Uses the same NGUI Canvas stack and auth patterns as SSA (`hpp-self-service-analytics-ui`), paired with `jakshwealth-api` on `/jw-api/`.

## Local development

1. Start the API (sibling repo):

```bash
cd ../jakshwealth-api
./run-api.sh
```

2. Install and run the UI:

```bash
cd jakshwealth-ui
npm install
npm start
```

Open **http://localhost:4200**. The dev proxy forwards `/jw-api` to `http://localhost:3000`.

With `JW_BYPASS_OKTA_AUTH=true` in the API `config.local.json`, use **Sign in** on the About page — no Okta setup required locally.

## Stock analysis

After sign-in, open **Stock Analysis** from Home or the header menu to run the NSE weekly HH-HL scanner against the bundled universe or a custom symbol list.
