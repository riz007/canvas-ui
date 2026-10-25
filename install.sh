#!/bin/sh
# canvas-ui installer: copies (or links) the skill into each agent's skill/extension folder.
set -eu

usage() {
  cat <<'EOF'
Usage: ./install.sh <target...> [--project DIR] [--link] [--dry-run]

Targets:
  claude     ~/.claude/skills/canvas-ui            (project: DIR/.claude/skills/canvas-ui)
  codex      ~/.codex/skills/canvas-ui             (+ prints an AGENTS.md snippet)
  gemini     ~/.gemini/extensions/canvas-ui        (project: DIR/.gemini/extensions/canvas-ui)
  cursor     DIR/.cursor/rules/canvas-ui.mdc + DIR/.cursor/skills/canvas-ui   (needs --project)
  opencode   ~/.config/opencode/skills/canvas-ui   (project: DIR/.opencode/skills/canvas-ui)
  agents     ~/.agents/skills/canvas-ui            (shared folder some agents read)
  all        claude codex gemini opencode agents

Options:
  --project DIR   Install into a project instead of your home folder
  --link          Symlink instead of copy (for developing the skill)
  --dry-run       Print what would happen

Alternatively: npx skills add <owner>/canvas-ui
EOF
}

SRC=$(cd "$(dirname "$0")" && pwd)
PROJECT=""; LINK=0; DRY=0; TARGETS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --project) PROJECT=$(cd "$2" && pwd); shift 2 ;;
    --link) LINK=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    all) TARGETS="$TARGETS claude codex gemini opencode agents"; shift ;;
    claude|codex|gemini|cursor|opencode|agents) TARGETS="$TARGETS $1"; shift ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
done
[ -n "$TARGETS" ] || { usage; exit 2; }

run() { if [ "$DRY" = 1 ]; then echo "  would: $*"; else "$@"; fi; }

# Copy only what an agent needs at runtime.
place() {
  dest=$1
  echo "→ $dest"
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    if [ -f "$dest/SKILL.md" ] && grep -q "^name: canvas-ui" "$dest/SKILL.md" 2>/dev/null || [ -L "$dest" ]; then
      run rm -rf "$dest"
    else
      echo "  ! $dest exists and is not canvas-ui; skipping" >&2; return 1
    fi
  fi
  run mkdir -p "$(dirname "$dest")"
  if [ "$LINK" = 1 ]; then run ln -s "$SRC" "$dest"; return 0; fi
  run mkdir -p "$dest"
  for item in SKILL.md LICENSE README.md references scripts assets templates; do
    [ -e "$SRC/$item" ] && run cp -R "$SRC/$item" "$dest/"
  done
  return 0
}

fill() { # replace {{SKILL_DIR}} in an adapter file
  if [ "$DRY" = 1 ]; then echo "  would: write $2"; else sed "s#{{SKILL_DIR}}#$3#g" "$1" > "$2"; fi
}

base() { if [ -n "$PROJECT" ]; then echo "$PROJECT/$1"; else echo "$HOME/$2"; fi; }

for t in $TARGETS; do
  case $t in
    claude)   place "$(base .claude/skills/canvas-ui .claude/skills/canvas-ui)" ;;
    opencode) place "$(base .opencode/skills/canvas-ui .config/opencode/skills/canvas-ui)" ;;
    agents)   place "$(base .agents/skills/canvas-ui .agents/skills/canvas-ui)" ;;
    codex)
      d=$(base .codex/skills/canvas-ui .codex/skills/canvas-ui)
      place "$d"
      echo "  Codex picks up skills from this folder. If your Codex build doesn't, add this to AGENTS.md:"
      sed "s#{{SKILL_DIR}}#$d#g" "$SRC/adapters/codex/AGENTS.md" | sed 's/^/    /'
      ;;
    gemini)
      d=$(base .gemini/extensions/canvas-ui .gemini/extensions/canvas-ui)
      place "$d"
      [ "$LINK" = 1 ] && { echo "  (--link: GEMINI.md and gemini-extension.json are not generated for linked installs)"; continue; }
      run cp "$SRC/adapters/gemini/gemini-extension.json" "$d/gemini-extension.json"
      fill "$SRC/adapters/gemini/GEMINI.md" "$d/GEMINI.md" "$d"
      ;;
    cursor)
      [ -n "$PROJECT" ] || { echo "cursor needs --project DIR" >&2; exit 2; }
      d="$PROJECT/.cursor/skills/canvas-ui"
      place "$d"
      run mkdir -p "$PROJECT/.cursor/rules"
      fill "$SRC/adapters/cursor/canvas-ui.mdc" "$PROJECT/.cursor/rules/canvas-ui.mdc" "$d"
      ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "Note: Node 20+ is needed for the canvas, token and screenshot tools. The workflow itself works without it."
fi
echo "Done. Ask your agent: \"Use canvas-ui to explore three directions for <your product>.\""
