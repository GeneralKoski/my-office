#!/bin/zsh
# Stops My Office if it is running: the process listening on its port, once it is this project's own server.
DIR="${0:A:h:h}"; PORT="${OFFICE_PORT:-4310}"
note() { osascript -e "display notification \"$1\" with title \"My Office\"" >/dev/null 2>&1; }
PID=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -1)
[ -z "$PID" ] && { note "Non era acceso."; exit 0; }
CWD=$(lsof -a -p "$PID" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
if [ "$CWD" != "$DIR" ] || ! ps -p "$PID" -o command= | grep -qE "cli.mjs start|server/index.mjs"; then
  osascript -e "display dialog \"Sulla porta $PORT c'è un altro programma: non lo fermo.\" buttons {\"OK\"} with icon caution" >/dev/null 2>&1; exit 1
fi
kill "$PID"
for _ in {1..20}; do kill -0 "$PID" 2>/dev/null || break; sleep 0.5; done
kill -0 "$PID" 2>/dev/null && kill -9 "$PID"
note "Spento."
