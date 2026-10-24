# Meridion Admin Dashboard

Meridion Admin is an independently deployable React + TypeScript + Vite dashboard for the Meridion Marketplace. It uses the same shared Supabase project (`paperloom-store`, ref `xrrhbnnzjqkqnqdvayjw`) and never creates a second backend or database.

## Project structure

```text
ecommers-admin-dashboard/
├── public/images/              # Brand/static image assets
├── src/
│   ├── app/                    # App root, providers, and router
│   ├── contexts/               # Supabase auth and toast state
│   ├── lib/                    # Browser-safe Supabase client
│   ├── pages/                  # Login and dashboard page modules
│   ├── services/               # Admin service barrel and data adapter
│   ├── types/                  # Database contracts
│   ├── admin.css               # Meridion admin design system
│   └── main.tsx                # Vite entrypoint
├── supabase/migrations/        # Shared migration history
├── .env.example
├── vercel.json                 # SPA route fallback
└── README.md
```

## Local development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Sign in with an existing Supabase Auth user that has the `admin` role in `public.user_roles`. The app checks `current_user_is_admin()` before loading dashboard data. Never use a service-role key in `.env.local` or browser code.

## Verification

```bash
pnpm typecheck
pnpm build
```
