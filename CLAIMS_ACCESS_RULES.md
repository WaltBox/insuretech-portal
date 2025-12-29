# Claims Access Rules

## Overview

Claims are fetched from the external Beagle API using email addresses of Property Managers and Centralized Members. 
The API is called like: `GET /claims?email=waltboxwell@gmail.com`

Each claim has:
- **Filed by**: Email of the PM or CM who filed it (stored in `filed_by_email`)
- **Incident**: Description of the incident
- **Claim date**: When the claim was filed
- **Status**: Current status of the claim

Claims are stored in the database and updated periodically from the Beagle API.

## Access Rules

### Centralized Members
- ✅ Can view **ALL claims** (from all PMs and CMs)

### Property Managers
- ✅ Can view **ONLY** claims where `filed_by_email` matches their email address
- ❌ **CANNOT** view claims filed by other PMs or CMs

## Database Changes

### New Column: `filed_by_email` (REQUIRED)
- Added to `claims` table
- Stores the email of the Property Manager or Centralized Member who filed the claim (from Beagle API)
- **This is the primary field used for access control**
- When fetching claims from Beagle API, this should be set to the email used in the API call

**Migration:** Run `supabase/add-claims-filed-by.sql`

## RLS Policies

Updated Row Level Security policies enforce these rules automatically:

1. **Admins and Centralized Members**: See all claims
2. **Property Managers**: See only:
   - Claims they filed (by email match)
   - Claims from their properties (but NOT if filed by a CM)

**Migration:** Run `supabase/update-claims-rls-policies.sql`

## API Usage

### Get Claims
```
GET /api/claims?filed_by_email=x@example.com
```

**Query Parameters:**
- `property_id` - Filter by property
- `filed_by_email` - Filter by who filed the claim (PM or CM email)
- `time_period` - Filter by time (week/month/year)
- `limit` - Number of results
- `cursor` - For pagination

**Note:** RLS policies automatically filter results based on the logged-in user's role and permissions.

## Important Notes

1. **When creating claims**, you must set `filed_by_email` to the email of the Property Manager or Centralized Member who is filing the claim.

2. **Example scenarios:**
   - Beagle API returns claim with `filed_by_email = waltboxwell@gmail.com` → Only PM with email `waltboxwell@gmail.com` can see it, CMs can see it
   - Beagle API returns claim with `filed_by_email = other@example.com` → PM with email `waltboxwell@gmail.com` CANNOT see it, CMs can see it
   - All claims → Centralized Members can see ALL claims regardless of who filed them

3. **Search by email:** Use the `filed_by_email` parameter to find all claims filed by a specific email address (for tracking purposes, not access control).

## Setup Steps

1. Run `supabase/add-claims-filed-by.sql` to add the `filed_by_email` column
2. Run `supabase/update-claims-rls-policies.sql` to update RLS policies
3. When fetching claims from Beagle API and storing them:
   - Call Beagle API with PM/CM email: `GET /claims?email=waltboxwell@gmail.com`
   - Store the returned claims with `filed_by_email = waltboxwell@gmail.com`
   - This ensures Property Managers only see claims they filed

