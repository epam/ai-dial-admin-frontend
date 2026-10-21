#!/usr/bin/env bash
# Regression suite for .claude/hooks/block-env-local-access.sh
#
# Run:  bash .claude/hooks/tests/block-env-local-access.test.sh
#
# The guard has to hold two lines at once: never let a local env file be read or written,
# and never get so broad that ordinary work stops. Both halves are asserted here — the
# "everyday commands" block is the half that keeps the guard usable.
#
# It needs a real .env*.local in the repo to exercise layers 2 and 3; without one those
# layers correctly allow everything, and the suite says so instead of reporting false passes.
set -u

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
HOOK="$ROOT/.claude/hooks/block-env-local-access.sh"
export CLAUDE_PROJECT_DIR="$ROOT"
cd "$ROOT" || exit 1

fails=0

run_bash() { jq -n --arg c "$1" '{tool_name:"Bash", tool_input:{command:$c}}' | bash "$HOOK"; }
run_tool() { jq -n --arg t "$1" --arg p "$2" '{tool_name:$t, tool_input:{file_path:$p}}' | bash "$HOOK"; }

check() { # <allow|deny> <label> <hook output>
  local want=$1 label=$2 out=$3 got
  if printf '%s' "$out" | grep -q '"permissionDecision": *"deny"'; then got=deny; else got=allow; fi
  if [ "$got" = "$want" ]; then
    printf 'PASS  %-5s  %s\n' "$got" "$label"
  else
    printf 'FAIL  want=%-5s got=%-5s  %s\n' "$want" "$got" "$label"
    fails=$((fails + 1))
  fi
}

# Built at runtime so this file's own commands never contain the literal path,
# which layer 1 would otherwise match when an agent greps this suite.
REAL="apps/ai-dial-admin/.envPLACEHOLDER.local"
REAL=${REAL/PLACEHOLDER/}

has_env=$(find "$ROOT" -maxdepth 4 \
  \( -name node_modules -o -name .next -o -name .git -o -name dist \) -prune -o \
  -type f -name '.env*.local' -print 2>/dev/null | head -1)

echo "── layer 1: the path is in the tool input ──"
check deny  "Bash reads the env file"              "$(run_bash "cat $REAL")"
check deny  "Read tool on the env file"            "$(run_tool Read "$REAL")"
check deny  "Write tool on the env file"           "$(run_tool Write "$REAL")"

if [ -z "$has_env" ]; then
  echo
  echo "SKIP: no .env*.local in this checkout — layers 2 and 3 allow everything by design."
  echo "Create one to exercise the rest of this suite."
  [ "$fails" -eq 0 ] && exit 0 || exit "$fails"
fi

echo "── layer 2: in-place write over a runtime-built path list ──"
check deny  "xargs + perl -0pi from a list file"   "$(run_bash "tr '\\n' '\\0' < /tmp/list.txt | xargs -0 perl -0pi -e 's/A/B/g'")"
check deny  "grep -rl | xargs perl -pi"            "$(run_bash "grep -rl FOO apps | xargs perl -pi -e 's/A/B/'")"
check deny  "find -exec sed -i"                    "$(run_bash "find src -name '*.ts' -exec sed -i '' 's/a/b/' {} +")"
check deny  "perl -i over \$(command)"             "$(run_bash "perl -pi -e 's/a/b/' \$(git ls-files '*.ts')")"

echo "── layer 2: waivers, which are the intended fix ──"
check allow "pipeline filters env out"             "$(run_bash "grep -rl FOO apps | grep -v '\\.env' | xargs perl -pi -e 's/A/B/'")"
check allow "find excludes env by name"            "$(run_bash "find src -type f ! -name '.env*' -exec sed -i '' 's/a/b/' {} +")"
check allow "reviewed marker"                      "$(run_bash "cat /tmp/list.txt | xargs perl -pi -e 's/A/B/'  # env-guard: reviewed")"

echo "── layer 3: recursive read that would print env contents ──"
check deny  "grep -r over the dir holding env"     "$(run_bash "grep -r ANALYTICS apps/ai-dial-admin")"
check allow "grep -rl prints names only"           "$(run_bash "grep -rl ANALYTICS apps/ai-dial-admin")"
check allow "grep -r over a dir below env's dir"   "$(run_bash "grep -r ANALYTICS apps/ai-dial-admin/src")"
check allow "grep -r with --exclude"               "$(run_bash "grep -r ANALYTICS apps/ai-dial-admin --exclude='.env*'")"

echo "── everyday commands must stay allowed ──"
check allow "git commit"                           "$(run_bash "git commit -m 'refactor: rename'")"
check allow "git status"                           "$(run_bash "git status --short")"
check allow "git mv a literal pair"                "$(run_bash "git mv src/a.ts src/b.ts")"
check allow "npx vitest"                           "$(run_bash "npx vitest run src/components/Analytics")"
check allow "npm run typecheck"                    "$(run_bash "npm run typecheck")"
check allow "rm a literal temp path"               "$(run_bash "rm -rf /tmp/scratch/build")"
check allow "sed without -i"                       "$(run_bash "sed -n '1,20p' package.json")"
check allow "grep non-recursive"                   "$(run_bash "grep -n ANALYTICS .env.template")"
check allow "find with no writer"                  "$(run_bash "find src -name '*.spec.ts'")"
check allow "Read tool on an ordinary file"        "$(run_tool Read "$ROOT/package.json")"

echo
if [ "$fails" -eq 0 ]; then echo "all cases passed"; else echo "$fails case(s) failed"; fi
exit "$fails"
