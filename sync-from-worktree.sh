#!/bin/bash
# sync-from-worktree.sh — run instead of "Apply" in Cursor
ORIG="/Users/gokul/Documents/AI Growth Operator"
LATEST=$(ls -dt /Users/gokul/.cursor/worktrees/AI_Growth_Operator/*/ 2>/dev/null | head -1 | sed 's:/$::')

if [ -z "$LATEST" ]; then
  echo "No worktrees found."
  exit 1
fi

CODE=$(basename "$LATEST")
echo "Syncing from worktree: $CODE"

# Copy env files into worktree so it can build
cp "$ORIG/.env.local" "$LATEST/.env.local" 2>/dev/null
cp "$ORIG/.env"       "$LATEST/.env"       2>/dev/null

# Sync changed files back to original (skip git, node_modules, env, db, .next)
rsync -a --checksum \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.env*' \
  --exclude='*.db*' \
  --exclude='.next/' \
  --exclude='.cursor/' \
  "$LATEST/" "$ORIG/"

echo "Done. Synced $CODE to original project."
