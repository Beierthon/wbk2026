#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "→ Installing dependencies..."
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm install

if [[ ! -f .env.local ]]; then
  echo "→ Creating .env.local from .env.example"
  cp .env.example .env.local
fi

if [[ ! -f apps/web/.env.local ]]; then
  echo "→ Creating apps/web/.env.local from apps/web/.env.example"
  cp apps/web/.env.example apps/web/.env.local
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]] && ! security find-generic-password -s "Supabase CLI" -w >/dev/null 2>&1; then
  echo "→ Supabase CLI not logged in — run: pnpm supabase:login"
else
  if [[ ! -f supabase/.temp/project-ref ]]; then
    echo "→ Linking Supabase project kjjrmuuhzibtwouaxabg"
    pnpm supabase:link
  else
    echo "→ Supabase project already linked"
  fi

  echo "→ Pushing migrations (API fallback when Postgres TCP blocked)"
  pnpm supabase:db:push:api || true

  echo "→ Applying demo seed"
  pnpm supabase:db:seed:api || true
fi

echo ""
echo "Done. Next steps:"
echo "  1. Fill NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (Dashboard → API)"
echo "  2. pnpm dev"
echo "  3. curl http://localhost:3000/api/supabase/health"
