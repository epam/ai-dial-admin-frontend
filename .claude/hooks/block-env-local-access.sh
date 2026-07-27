#!/usr/bin/env bash
# PreToolUse guard: deny any read or write of a local env file (.env.local, .env.*.local)
# and redirect to .env.template. Covers Read, Grep, Edit, Write, NotebookEdit and shell commands.
set -u

payload=$(cat)
tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')

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

if ! printf '%s' "$target" | grep -qE '\.env[A-Za-z0-9._-]*\.local'; then
  exit 0
fi

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

case "$mode" in
  read)  reason=$read_guidance ;;
  write) reason=$write_guidance ;;
  shell) reason="Shell access to local env files (.env.local, .env.*.local) is blocked, for reading and writing alike.

$read_guidance

$write_guidance" ;;
esac

jq -n --arg reason "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $reason
  }
}'
exit 0
