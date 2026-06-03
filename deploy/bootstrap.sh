#!/usr/bin/env bash
# One-time setup for a fresh Amazon Linux 2023 EC2 host.
# Installs Docker + the compose plugin and prepares /opt/app.
set -euo pipefail

echo "==> Installing Docker (Amazon Linux 2023)"
sudo dnf -y update
sudo dnf -y install docker git

echo "==> Installing docker compose plugin"
sudo mkdir -p /usr/libexec/docker/cli-plugins
COMPOSE_VERSION="v2.29.7"
ARCH="$(uname -m)"
sudo curl -fsSL \
  "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${ARCH}" \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

echo "==> Enabling Docker service"
sudo systemctl enable --now docker
sudo usermod -aG docker "${USER}"

echo "==> Preparing /opt/app"
sudo mkdir -p /opt/app
sudo chown "${USER}:${USER}" /opt/app

echo "==> Done. Log out/in (or run 'newgrp docker') so the docker group applies."
docker --version
docker compose version || sudo docker compose version
