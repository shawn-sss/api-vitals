#!/usr/bin/env bash
set -euo pipefail

# Go to the directory where this script lives (repo root)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Spring Boot app..."
echo

# Sanity checks (optional but helpful)
if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: Java is not installed or not on PATH."
  echo "Install a JDK (your project targets Java 25) and try again."
  exit 1
fi

# Ensure Maven Wrapper is executable
if [[ ! -x "./mvnw" ]]; then
  chmod +x ./mvnw || true
fi

# Run the app (equivalent to: call mvnw.cmd spring-boot:run)
./mvnw spring-boot:run

echo
echo "App stopped."

# Mimic Windows 'pause' only when running interactively
if [[ -t 0 ]]; then
  read -r -p "Press Enter to close..."
fi

