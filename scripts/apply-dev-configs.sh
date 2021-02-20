#!/usr/bin/env sh
SCRIPT_PATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 || exit ; pwd -P )"

kubectl apply -f $SCRIPT_PATH/../kube-configs/dev-configmap.yaml
kubectl apply -f $SCRIPT_PATH/../kube-configs/dev-secret.yaml
