#!/usr/bin/env bash
set -euo pipefail

# Release script — keeps package.json, git tag, npm, and GitHub releases in sync.
#
# Prerequisites:
#   - npm login (only sanjay1909 can publish)
#   - gh auth login (for GitHub release creation)
#
# Usage:
#   npm run release:patch   # 0.4.0 → 0.4.1
#   npm run release:minor   # 0.4.0 → 0.5.0
#   npm run release:major   # 0.4.0 → 1.0.0

BUMP="${1:?Usage: release.sh <patch|minor|major>}"

# 1. Validate
if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Error: bump must be patch, minor, or major (got: $BUMP)"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

# 2. Build + typecheck (fail early before touching version)
echo "==> Building and typechecking..."
npm run build
npm run typecheck

# 3. Bump version in package.json (no git tag yet)
npm version "$BUMP" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
echo "==> Bumped to v$VERSION"

# 4. Check CHANGELOG has an entry for this version
if ! grep -q "## \[$VERSION\]" CHANGELOG.md; then
  echo "Error: CHANGELOG.md has no entry for [$VERSION]."
  echo "Add a ## [$VERSION] section before releasing."
  # Revert the version bump
  git checkout package.json
  exit 1
fi

# 5. Extract release notes from CHANGELOG.md
NOTES=$(awk "/^## \[$VERSION\]/{found=1; next} /^## \[/{if(found) exit} found{print}" CHANGELOG.md)
if [[ -z "$NOTES" ]]; then
  echo "Warning: CHANGELOG.md entry for [$VERSION] is empty. Continuing anyway."
fi

# 6. Commit + tag + push
git add package.json
git commit -m "chore: release v$VERSION"
git tag "v$VERSION"
git push
git push --tags

# 7. Publish to npm
npm publish

# 8. Create GitHub release (with notes from CHANGELOG)
if command -v gh &> /dev/null; then
  echo "==> Creating GitHub release..."
  gh release create "v$VERSION" \
    --title "v$VERSION" \
    --notes "$NOTES" \
    --latest
  echo "    release: https://github.com/footprintjs/explainable-ui/releases/tag/v$VERSION"
else
  echo "Warning: gh CLI not found. Skipping GitHub release creation."
  echo "Run manually: gh release create v$VERSION --title v$VERSION --latest"
fi

echo ""
echo "==> Released v$VERSION"
echo "    npm: https://www.npmjs.com/package/footprint-explainable-ui/v/$VERSION"
echo "    changelog: CHANGELOG.md"
