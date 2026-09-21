#!/usr/bin/env bash
# PreToolUse guard: deny any read or write of a local env file (.env.local, .env.*.local)
# and redirect to .env.template. Covers Read, Grep, Edit, Write, NotebookEdit and shell commands.
#
# Three layers, because a shell command's text does not name every file it touches:
#   1. literal  — the path appears in the tool input (catches `cat .env.local`)
#   2. blind write — an in-place writer fed paths that only exist at runtime, e.g.
#      `xargs perl -pi`, `find -exec sed -i`, `$(grep -rl …)`. This is the hole that let a
#      repo-wide rename edit .env.local: the path never appeared in the command text.
#   3. sweeping read — a recursive content search over a directory that holds an env file
#
# Layers 2 and 3 are skipped when the repo has no local env file, and either layer can be
# waived by excluding env files explicitly (see WAIVER below) — that is the intended fix,
# not a workaround.
set -u

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')

ENV_PATTERN='\.env[A-Za-z0-9._-]*\.local'

case "$tool" in
  Read|Grep)
    mode=read
    target=$(printf '%s' "$payload" | jq -r '[.tool_input.file_path, .tool_input.path] | map(select(. != null)) | join(" ")')
    ;;
  Edit|Write|NotebookEdit)
    mode=write
    target=$(printf '%s' "$payload" | jq -r '[.tool_input.file_path, .tool_input.notebook_path] | map(select(. != null)) | join(" ")')
    ;;
  Bash)
    mode=shell
    target=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')
    ;;
  *)
    exit 0
    ;;
esac

read_guidance=$(cat <<'EOF'
Reading local env files (.env.local, .env.*.local) is blocked — they hold real secrets.

Do this instead:
1. Read .env.template (repo root) — it lists every supported variable.
2. Find the variable you need there by name.
3. Reference it by name in code (e.g. process.env.MY_VAR) and assume it is already
   configured locally with a correct value. Do not ask for or infer its value.

Do not work around this: no cat/head/tail/grep/sed/awk/find -exec, no reading a copy,
and no printing the file through any other command.
EOF
)

write_guidance=$(cat <<'EOF'
Writing to local env files (.env.local, .env.*.local) is blocked — they are untracked,
per-developer files holding real secrets, and are not yours to change.

Do this instead:
1. If the code needs a NEW variable, add it to .env.template (repo root) as a commented
   entry with a short description. That is the tracked, shareable file.
2. Reference the variable by name in code and assume the developer has already set a
   correct value in their own local env file.
3. If a local value actually needs to change, say which variable to set and let the
   user edit their env file themselves.

Do not work around this: no shell redirection, no cp/mv/sed -i, no writing a copy and
renaming it into place.
EOF
)

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# ── Layer 1: the path is right there in the tool input ────────────────────────
if printf '%s' "$target" | grep -qE "$ENV_PATTERN"; then
  case "$mode" in
    read)  deny "$read_guidance" ;;
    write) deny "$write_guidance" ;;
    shell) deny "Shell access to local env files (.env.local, .env.*.local) is blocked, for reading and writing alike.

$read_guidance

$write_guidance" ;;
  esac
fi

# Layers 2 and 3 reason about shell commands only.
[ "$mode" = shell ] || exit 0

root=${CLAUDE_PROJECT_DIR:-$PWD}

# Locate the real local env files. No match -> nothing to protect, allow everything.
env_files=$(find "$root" -maxdepth 4 \
  \( -name node_modules -o -name .next -o -name .git -o -name dist \) -prune -o \
  -type f -name '.env*.local' -print 2>/dev/null)
[ -n "$env_files" ] || exit 0

# ── WAIVER ────────────────────────────────────────────────────────────────────
# An explicit, reviewable exclusion turns the guard off for this command. Any of:
#   --exclude='.env*'            (grep/rg)
#   ! -name '.env*'              (find)
#   | grep -v '\.env'            (filtering a generated path list)
#   # env-guard: reviewed        (you inspected the list yourself)
if printf '%s' "$target" | grep -qE -- '--exclude[=[:space:]]+[^[:space:]]*\.env|(!|-not)[[:space:]]+-name[[:space:]]+[^[:space:]]*\.env|grep[[:space:]]+-[A-Za-z]*v[A-Za-z]*[[:space:]]+[^|]*\.env|#[[:space:]]*env-guard:[[:space:]]*reviewed'; then
  exit 0
fi

# ── Layer 2: in-place write over a path list that only exists at runtime ──────
writer='(\bperl\b[^|;&]*[[:space:]]-[A-Za-z0-9]*i)|(\bsed\b[^|;&]*[[:space:]]-[A-Za-z]*i)|(\bruby\b[^|;&]*[[:space:]]-[A-Za-z0-9]*i)|(\bsd\b)|(\bsponge\b)|(\btee\b)|(\brm\b)|(\bmv\b)|(\bcp\b)|(\btruncate\b)|(\bshred\b)|(-delete\b)'
opaque='(\bxargs\b)|(-exec\b)|(\$\()|(`)|(\bwhile[[:space:]]+read\b)|(\bfind\b)|(\bgit[[:space:]]+ls-files\b)'

if printf '%s' "$target" | grep -qE "$writer" && printf '%s' "$target" | grep -qE "$opaque"; then
  deny "Blocked: this command writes in place over a list of paths that only exists at
runtime (xargs / find -exec / command substitution), so the guard cannot tell whether a
local env file is in that list. One such command has already edited .env.local here — the
path was never in the command text, so the literal check could not see it.

Local env files (.env.local, .env.*.local) are untracked, per-developer files holding real
secrets, and are not yours to change.

Do one of these:
1. Exclude env files where the list is built, and say so in the command:
     grep -rl 'PATTERN' src --exclude='.env*' | xargs perl -pi -e '...'
     ... | grep -v '\.env' | xargs perl -pi -e '...'
     find src -type f ! -name '.env*' -exec sed -i '' 's/a/b/' {} +
2. Print the list first, read it, then pass the paths literally.
3. If you have already inspected the list and it holds no env file, re-run the exact
   command with a trailing '# env-guard: reviewed' marker.

A NEW variable belongs in .env.template (repo root) as a commented entry. If an existing
local value must change, name the variable and let the user edit their env file."
fi

# ── Layer 3: recursive content search covering a directory that holds an env file ──
reader='(\bgrep\b[^|;&]*[[:space:]]-[A-Za-z]*[rR])|(\brg\b)|(\bag\b)|(-exec[[:space:]]+(cat|head|tail))'
names_only='([[:space:]]-[A-Za-z]*l\b)|(--files-with-matches)|([[:space:]]-[A-Za-z]*c\b)|(--count)'

if printf '%s' "$target" | grep -qE "$reader" && ! printf '%s' "$target" | grep -qE "$names_only"; then
  # Does the command actually reach a directory that holds an env file?
  covers=0
  while IFS= read -r env_file; do
    [ -n "$env_file" ] || continue
    env_dir=$(cd "$(dirname "$env_file")" 2>/dev/null && pwd) || continue
    found_path=0
    for token in $target; do
      case "$token" in -*) continue ;; esac
      token=${token%\'}; token=${token#\'}
      token=${token%\"}; token=${token#\"}
      [ -e "$token" ] || continue
      [ -d "$token" ] || token=$(dirname "$token")
      abs=$(cd "$token" 2>/dev/null && pwd) || continue
      found_path=1
      # Covered only when the env file sits at or below the searched directory.
      # A directory *inside* env_dir (…/ai-dial-admin/src) never reaches …/ai-dial-admin/.env.local.
      [ "$abs" = "$env_dir" ] && covers=1
      case "$env_dir/" in "$abs"/*) covers=1 ;; esac
    done
    # A recursive search with no path argument runs from the cwd — assume it reaches.
    [ "$found_path" -eq 1 ] || covers=1
  done <<EOF
$env_files
EOF

  if [ "$covers" -eq 1 ]; then
    deny "Blocked: this recursive search prints matching lines from a directory that holds a
local env file, so a secret can land in the transcript.

$read_guidance

Re-run it excluding env files, which the guard accepts:
  grep -r 'PATTERN' <dir> --exclude='.env*'
  rg 'PATTERN' <dir> --glob '!.env*'
Listing file names only (grep -rl / --files-with-matches) is allowed and not blocked."
  fi
fi

exit 0
