#!/bin/bash
# UserPromptSubmit hook — detects feature-request prompts and nudges
# Claude to invoke the /build skill for structured development.

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')

# Skip empty, slash commands, or short prompts
[[ -z "$PROMPT" || "$PROMPT" == /* ]] && exit 0
WORDS=$(echo "$PROMPT" | wc -w | tr -d ' ')
(( WORDS < 8 )) && exit 0

# Skip questions and simple commands
echo "$PROMPT" | grep -iqE '^(how|what|why|where|when|can you (tell|explain|show|help)|does|is|should|could|would|explain|show|describe|help me|check|review|fix|debug|test|run|commit|push|deploy|look at|read|find|search|which|update|change|rename|move|delete|remove|refactor|clean)(\s|$)' && exit 0

# Detect: action verb + feature-like noun
HAS_ACTION=$(echo "$PROMPT" | grep -icE '\b(build|create|add|implement|make|set up|design|develop|scaffold|wire up|hook up|integrate|stand up)\b')
HAS_FEATURE=$(echo "$PROMPT" | grep -icE '\b(feature|page|screen|component|form|dashboard|login|signup|sign.?up|auth|crud|endpoint|workflow|system|module|section|panel|view|modal|dialog|notification|settings|profile|onboarding|chat|messaging|payment|checkout|search|filter|upload|import|export|sidebar|navbar|header|footer|menu|calendar|timeline|feed|gallery|editor|admin|user.?management|account|billing|subscription|integration|webhook|real.?time|socket|landing|home.?page|registration|password|oauth|sso|permissions|roles|invite|team|org|analytics|report|monitor)\b')

if (( HAS_ACTION > 0 && HAS_FEATURE > 0 )); then
  echo "Feature request detected — invoke the /build skill for structured full-stack development (4-agent research → brainstorming spec → gap analysis → chunked plan → verified implementation)."
fi
