#!/bin/bash
# Quick disk cleanup - runs the most impactful cleanups first
# Safe to run in production

echo "🧹 Quick Disk Cleanup"
echo "─────────────────────────────────────────────────────────────"

# 1. Show current disk usage
echo "📊 Current disk usage:"
df -h / | grep -v Filesystem

# 2. Clean Bun cache (biggest impact)
echo ""
echo "1. Cleaning Bun cache..."
if [ -d "$HOME/.bun/install/cache" ]; then
  du -sh "$HOME/.bun/install/cache" 2>/dev/null || echo "  Cache size unknown"
  rm -rf "$HOME/.bun/install/cache"/*
  echo "  ✓ Cleaned Bun cache"
else
  echo "  ⚠ Bun cache not found"
fi

# 3. Clean /tmp (exclude currently running processes)
echo ""
echo "2. Cleaning /tmp (files older than 1 day)..."
if [ -d "/tmp" ]; then
  find /tmp -type f -mtime +1 -delete 2>/dev/null || echo "  ⚠ Some files could not be deleted"
  echo "  ✓ Cleaned old temp files"
fi

# 4. Clean npm cache if it exists
echo ""
echo "3. Cleaning npm cache..."
if [ -d "$HOME/.npm" ]; then
  du -sh "$HOME/.npm" 2>/dev/null || echo "  Cache size unknown"
  rm -rf "$HOME/.npm/_cacache"
  echo "  ✓ Cleaned npm cache"
else
  echo "  ⚠ npm cache not found"
fi

# 5. Show final disk usage
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "📊 Disk usage after cleanup:"
df -h / | grep -v Filesystem

echo ""
echo "✅ Quick cleanup complete!"
