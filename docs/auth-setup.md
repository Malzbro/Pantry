# Authentication Setup

Manual steps required once per environment (local, staging, production).

## 1. Supabase Dashboard

### Email Auth
1. Go to **Authentication > Providers > Email**.
2. Confirm **"Confirm email"** is **ON**.

### Google OAuth
1. Go to **Authentication > Providers > Google > Enable**.
2. Paste the **Client ID** and **Client Secret** from Google Cloud Console (see below).

### Redirect URLs
1. Go to **Authentication > URL Configuration**.
2. Set **Site URL** to your production Vercel URL (e.g. `https://pantry.example.com`).
3. Add to **Redirect URLs**:
   - `http://localhost:3000/**`
   - `https://<vercel-url>/**`

## 2. Google Cloud Console (OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. **APIs & Services > OAuth consent screen** > External. Fill in app name, support email, dev contact.
4. **APIs & Services > Credentials > Create Credentials > OAuth client ID** > Web application.
5. Add **Authorised redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`
   - For this project: `https://hzepmiwqdfpwwglaykik.supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret** into the Supabase dashboard (step 1 above).

## 3. Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from Supabase>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (`.env`)
```
SUPABASE_URL=https://<project-ref>.supabase.co
```

## 4. Run the Alembic Migration

```bash
cd backend
alembic upgrade head
```

This creates the `handle_new_user()` trigger on `auth.users` that auto-creates:
- A `profiles` row
- A default `households` row ("My household")
- A `household_members` entry with role `owner`

## 5. Install Backend Dependency

```bash
cd backend
pip install "PyJWT[crypto]>=2.8"
```

## 6. Verify

1. Start the backend: `cd backend && uvicorn main:app --reload`
2. Start the frontend: `npm run dev`
3. Sign up with a test email at `http://localhost:3000/sign-up`.
4. Confirm the email via the link Supabase sends.
5. After sign-in, verify in the database:
   ```sql
   SELECT * FROM profiles WHERE id = '<user-uuid>';
   SELECT * FROM households WHERE created_by_user_id = '<user-uuid>';
   SELECT * FROM household_members WHERE user_id = '<user-uuid>';
   ```
   All three rows should exist.

## Edge Cases

- **Trigger failure**: If the trigger fails mid-flight (e.g. unique constraint violation), the `auth.users` INSERT is NOT rolled back — Supabase Auth commits independently. The user would exist in `auth.users` but lack a profile/household. A retry of the signup with the same email will fail at the Supabase level ("user already exists"). Resolution: manually insert the missing rows or delete the orphaned auth user via the Supabase dashboard.
- **Eval harness**: The backend accepts a `SUPABASE_URL` env var pointing to the JWKS endpoint. For eval/CI, either use a real test token from a seeded user, or set `BYPASS_AUTH=1` and wrap `current_user_id()` to return the test UUID when that var is set.
