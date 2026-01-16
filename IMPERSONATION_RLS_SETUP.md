# Impersonation RLS Setup

This setup allows RLS (Row Level Security) policies to respect impersonation, so when an admin impersonates a Property Manager, they see exactly what that PM would see.

## Setup Steps

### 1. Run the Impersonation Support SQL
In Supabase SQL Editor, run:
- `supabase/impersonation-rls-support.sql`

This creates:
- `_impersonation_context` table to store impersonation state
- `get_effective_user_id()` function - returns impersonated user ID or actual user ID
- `get_effective_user_role()` function - returns the effective user's role
- `get_effective_user_email()` function - returns the effective user's email
- `set_impersonation_context()` function - called by the app to set impersonation

### 2. Run the Claims RLS Policies
In Supabase SQL Editor, run:
- `supabase/fix-claims-rls-complete.sql`

This creates RLS policies that use the effective user functions, so they respect impersonation.

### 3. How It Works

1. **When impersonating**: The app calls `set_impersonation_context()` which stores the impersonated user ID in `_impersonation_context` table
2. **RLS policies check**: The policies call `get_effective_user_role()` and `get_effective_user_email()` which return the impersonated user's info
3. **Result**: Admin sees exactly what the PM would see

## Access Rules (with Impersonation)

### When Admin Impersonates Property Manager:
- ✅ Sees ONLY claims where `filed_by_email` matches the PM's email
- ❌ Sees 0 claims if `filed_by_email` is NULL or doesn't match

### When Admin Impersonates Centralized Member:
- ✅ Sees ALL claims (no filtering)

### When Admin Views as Admin:
- ✅ Sees ALL claims (no filtering)

## Technical Details

- Uses `_impersonation_context` table to store impersonation state per connection
- Connection ID format: `{actual_user_id}_{backend_pid}`
- Entries expire after 5 minutes (auto-cleanup)
- Functions are `SECURITY DEFINER` so they can check the context table
- RLS policies automatically use effective user functions

## Testing

1. Log in as admin
2. Impersonate a Property Manager
3. Navigate to Claims page
4. You should see ONLY claims where `filed_by_email` matches the PM's email
5. If no claims match, you should see 0 claims










