#!/bin/bash
# UserPromptSubmit hook — reminds user to run init if project still uses @myapp defaults.
# To permanently skip: touch .claude/.init-skip

# Skip if user has opted out
[[ -f .claude/.init-skip ]] && exit 0

# Skip if already personalized
grep -q '"@myapp/' package.json 2>/dev/null || exit 0

cat <<'MSG'
This project still uses the default @myapp placeholder. Run the init script to personalize it:

  pnpm init:project

To skip this reminder permanently:

  touch .claude/.init-skip
MSG
