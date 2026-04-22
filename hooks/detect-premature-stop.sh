#!/bin/bash
# Detects when an agent stops on a tool call without producing a text response.
# Open source models sometimes bail after a tool call when they should keep going.
#
# Exit 0 = allow stop
# Exit 2 = block stop (stderr is fed back to the agent as the reason to continue)

LOG_DIR="${CLAUDE_PLUGIN_DATA:-${HOME}/.claude/plugins/data/harris-skills}"
LOG_FILE="$LOG_DIR/premature-stop.log"
mkdir -p "$LOG_DIR"

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Always allow if already continued from a stop hook (prevent infinite loops)
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# last_assistant_message is the text content of the final response.
# If it's empty/null, the agent ended on a tool call with no text after it.
LAST_MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // ""')

if [ -z "$LAST_MSG" ]; then
  echo "$TIMESTAMP session=$SESSION_ID action=kickstart" >> "$LOG_FILE"
  echo "You stopped without providing a text response after your last tool call. Continue working on the task." >&2
  exit 2
fi

exit 0
