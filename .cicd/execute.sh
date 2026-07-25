#!/bin/bash
set -e
cd /home
export NG_CLI_ANALYTICS="ci"
npm ci
npm run lint
npm run test
npm run build${1^}
