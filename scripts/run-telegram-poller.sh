#!/usr/bin/env bash
set -euo pipefail

cd /home/ubuntu/escala/escala-medica

set -a
. /home/ubuntu/escala/escala-medica/.env
set +a

/usr/bin/flock -n /tmp/escala-medica-telegram-poller.lock /usr/bin/node /home/ubuntu/escala/escala-medica/scripts/poll-telegram-commands.cjs >> /var/log/escala-medica-telegram-poller.log 2>&1