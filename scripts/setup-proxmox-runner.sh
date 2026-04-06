#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# BoltBerry – Proxmox Self-Hosted GitHub Actions Runner Setup
# Ausführen auf einer frischen Ubuntu 22.04 VM im Proxmox-Cluster
#
# Verwendung:
#   chmod +x setup-proxmox-runner.sh
#   sudo ./setup-proxmox-runner.sh <RUNNER_TOKEN> <RUNNER_LABEL>
#
# RUNNER_TOKEN:  In GitHub → Settings → Actions → Runners → "New self-hosted runner"
# RUNNER_LABEL:  z.B. "linux-proxmox" oder "windows-proxmox"
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="https://github.com/RollBerry-Studios/BoltBerry"
RUNNER_TOKEN="${1:?Fehler: RUNNER_TOKEN als 1. Argument angeben}"
RUNNER_LABEL="${2:-linux-proxmox}"
RUNNER_USER="github-runner"
RUNNER_HOME="/home/${RUNNER_USER}/actions-runner"
RUNNER_VERSION="2.319.1"

echo "=== BoltBerry Proxmox Runner Setup ==="
echo "Repo:    ${REPO_URL}"
echo "Label:   ${RUNNER_LABEL}"
echo ""

# 1 – System-Pakete
echo "[1/6] System-Pakete installieren..."
apt-get update -qq
apt-get install -y curl git build-essential python3 dpkg fakeroot \
  libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils \
  libatspi2.0-0 libdrm2 libxkbcommon0 libgbm1

# 2 – Node.js 20
echo "[2/6] Node.js 20 installieren..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "  Node $(node -v) / npm $(npm -v)"

# 3 – Runner-Benutzer anlegen
echo "[3/6] Runner-Benutzer anlegen..."
if ! id "${RUNNER_USER}" &>/dev/null; then
  useradd -m -s /bin/bash "${RUNNER_USER}"
fi

# 4 – Runner herunterladen
echo "[4/6] GitHub Actions Runner ${RUNNER_VERSION} herunterladen..."
sudo -u "${RUNNER_USER}" bash -c "
  mkdir -p '${RUNNER_HOME}'
  cd '${RUNNER_HOME}'
  curl -fsSLo actions-runner.tar.gz \
    'https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz'
  tar xzf actions-runner.tar.gz
  rm actions-runner.tar.gz
"

# 5 – Runner konfigurieren
echo "[5/6] Runner konfigurieren..."
sudo -u "${RUNNER_USER}" bash -c "
  cd '${RUNNER_HOME}'
  ./config.sh \
    --url '${REPO_URL}' \
    --token '${RUNNER_TOKEN}' \
    --name '$(hostname)-${RUNNER_LABEL}' \
    --labels '${RUNNER_LABEL},self-hosted,linux,x64' \
    --work _work \
    --unattended
"

# 6 – Als systemd-Dienst einrichten
echo "[6/6] systemd-Dienst einrichten..."
cat > /etc/systemd/system/github-runner.service << EOF
[Unit]
Description=GitHub Actions Self-Hosted Runner (BoltBerry)
After=network.target

[Service]
ExecStart=${RUNNER_HOME}/run.sh
User=${RUNNER_USER}
WorkingDirectory=${RUNNER_HOME}
KillMode=process
KillSignal=SIGTERM
TimeoutStopSec=5min
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now github-runner

echo ""
echo "=== Setup abgeschlossen ==="
echo "Runner-Status: $(systemctl is-active github-runner)"
echo ""
echo "Nächste Schritte:"
echo "  1. Im GitHub-Repo unter Settings → Actions → Runners prüfen, ob Runner online ist"
echo "  2. In den Repo-Variablen USE_SELF_HOSTED=true setzen um Proxmox-Runner zu nutzen"
echo "  3. Für Windows-Builds: dieses Script auf einer Windows-VM anpassen (PowerShell-Version)"
