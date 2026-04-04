#!/usr/bin/env bash
set -euo pipefail

cd /home/ubuntu/escala/escala-medica

set -a
. /home/ubuntu/escala/escala-medica/.env
set +a

/usr/bin/npm run report:monthly >> /var/log/escala-medica-monthly-report.log 2>&1