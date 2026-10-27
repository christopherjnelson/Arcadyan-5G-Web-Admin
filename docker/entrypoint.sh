#!/bin/sh
set -eu

# Only a host and port may be interpolated into the nginx configuration.
case "$GATEWAY_HOST" in
  ''|*[!a-zA-Z0-9.-]*|-*|.*)
    echo "GATEWAY_HOST must be an IPv4 address or DNS hostname" >&2
    exit 1
    ;;
esac
case "$GATEWAY_PORT" in
  ''|*[!0-9]*|??????*)
    echo "GATEWAY_PORT must be an integer from 1 to 65535" >&2
    exit 1
    ;;
esac
if [ "$GATEWAY_PORT" -lt 1 ] || [ "$GATEWAY_PORT" -gt 65535 ]; then
  echo "GATEWAY_PORT must be an integer from 1 to 65535" >&2
  exit 1
fi

envsubst '${GATEWAY_HOST} ${GATEWAY_PORT}' \
  < /etc/nginx/arcadyan.conf.template > /tmp/arcadyan-nginx.conf
exec nginx -c /tmp/arcadyan-nginx.conf -g 'daemon off;'
