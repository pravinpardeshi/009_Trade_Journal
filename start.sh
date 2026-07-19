#!/bin/sh
APP_DIR="$HOME/opencode_projects/010_reporting_app"
BACKEND_DIR="$APP_DIR/backend"
VENV_PYTHON="$APP_DIR/.venv/bin/python"
HOST="0.0.0.0"
PORT="8223"
PID_FILE="$APP_DIR/uvicorn.pid"
LOG_FILE="$APP_DIR/uvicorn.log"

stop_server() {
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null
    rm "$PID_FILE"
    echo "Stopped"
  else
    echo "Not running"
  fi
}

case "$1" in
  stop)
    stop_server
    exit 0
    ;;
  restart)
    stop_server
    sleep 1
    ;;
esac

SSL_CERT="$BACKEND_DIR/certs/server.crt"
SSL_KEY="$BACKEND_DIR/certs/server.key"

nohup "$VENV_PYTHON" -m uvicorn main:app --reload --host "$HOST" --port "$PORT" --ssl-keyfile "$SSL_KEY" --ssl-certfile "$SSL_CERT" --app-dir "$BACKEND_DIR" > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"
echo "Started (PID $(cat "$PID_FILE"))"
echo "Logs: $LOG_FILE"
