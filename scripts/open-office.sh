#!/bin/zsh
# Starts My Office if it is not running (building it first when the code changed since the last build), then opens it in
# the browser. Used by the "My Office" app on the Desktop; it also works from a terminal. NO_OPEN=1: don't open the browser.
DIR="${0:A:h:h}"; PORT="${OFFICE_PORT:-4310}"; URL="http://localhost:$PORT"
cd "$DIR" || exit 1
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
mkdir -p data
up() { curl -fs -m 2 "$URL/health" >/dev/null 2>&1; }
note() { osascript -e "display notification \"$1\" with title \"My Office\"" >/dev/null 2>&1; }
if ! up; then
  if [ ! -f .next/BUILD_ID ] || [ -n "$(find src app next.config.mjs -newer .next/BUILD_ID -type f -print -quit 2>/dev/null)" ]; then
    note "Compilo la nuova versione…"
    npx next build >> data/server.log 2>&1 || { osascript -e 'display dialog "La compilazione è fallita. Dettagli in my-office/data/server.log" buttons {"OK"} with icon stop' >/dev/null 2>&1; exit 1; }
  fi
  nohup node bin/cli.mjs start >> data/server.log 2>&1 < /dev/null &
  disown
  for _ in {1..60}; do up && break; sleep 1; done
  up || { osascript -e 'display dialog "My Office non è partito. Dettagli in my-office/data/server.log" buttons {"OK"} with icon stop' >/dev/null 2>&1; exit 1; }
fi
[ -n "$NO_OPEN" ] || open "$URL"
