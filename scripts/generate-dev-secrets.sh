#!/usr/bin/env sh
SCRIPT_PATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 || exit ; pwd -P )"
CONF_PATH="kube-configs/dev-secret.yaml"

if [ -e "$SCRIPT_PATH/../$CONF_PATH" ]; then
  echo "$CONF_PATH already exists. exiting..."
  exit 0
fi

KEYCLOAK_RESOURCE="mytrack-front"
KEYCLOAK_SECRET_MSG="REPLACE_WITH_BASE64_ENCODED_SECRET"

cat <<EOF
Values used:
keycloak.resource=$KEYCLOAK_RESOURCE
keycloak.credentials.secret=$KEYCLOAK_SECRET_MSG
EOF

ENC_KEYCLOAK_RESOURCE=$(echo "$KEYCLOAK_RESOURCE" | tr -d '\n' | base64)

cat  > $CONF_PATH <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: mytrack-front-secret
type: Opaque
data:
  keycloak.resource: $ENC_KEYCLOAK_RESOURCE
  keycloak.credentials.secret: $KEYCLOAK_SECRET_MSG
EOF

echo "$CONF_PATH generated successfully"
exit 0
