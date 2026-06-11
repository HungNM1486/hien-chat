#!/bin/sh
set -eu

: "${TURN_REALM:?TURN_REALM is required}"
: "${TURN_HOST:?TURN_HOST is required}"
: "${TURN_USERNAME:?TURN_USERNAME is required}"
: "${TURN_PASSWORD:?TURN_PASSWORD is required}"

CONF="/tmp/turnserver.conf"

sed \
  -e "s|@TURN_REALM@|${TURN_REALM}|g" \
  -e "s|@TURN_HOST@|${TURN_HOST}|g" \
  -e "s|@TURN_USERNAME@|${TURN_USERNAME}|g" \
  -e "s|@TURN_PASSWORD@|${TURN_PASSWORD}|g" \
  /etc/coturn/turnserver.conf.template > "${CONF}"

if [ -n "${TURN_EXTERNAL_IP:-}" ]; then
  echo "external-ip=${TURN_EXTERNAL_IP}" >> "${CONF}"
fi

exec turnserver -c "${CONF}"
