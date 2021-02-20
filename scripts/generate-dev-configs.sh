#!/usr/bin/env sh
SCRIPT_PATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 || exit ; pwd -P )"
CONF_PATH="kube-configs/dev-configmap.yaml"
mkdir -p $SCRIPT_PATH/../kube-configs

if [ -e "$SCRIPT_PATH/../$CONF_PATH" ]; then
  echo "$CONF_PATH already exists. exiting..."
  exit 0
fi

cat  > $CONF_PATH <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: mytrack-front-config-file
data:
  application.properties: |
    keycloak.auth-server-url=http://keycloak:9999/auth
    mytrack.api-host=mytrack-srv
    mytrack.api-port=9090
    mytrack.api-schema=http
EOF

echo "$CONF_PATH generated successfully"
exit 0
