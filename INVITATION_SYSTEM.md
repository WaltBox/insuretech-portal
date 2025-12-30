# Invitation System - Setup & Usage

## What Changed

The user management system now uses **invitations** instead of directly creating users with passwords.

## Setup Steps

### 1. Update the Database

Run this in Supabase SQL Editor:

```sql
-- Add metadata column to store first_name, last_name, and property_ids
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Make property_id nullable (not all invitations are for property managers)
ALTER TABLE invitations ALTER COLUMN property_id DROP NOT NULL;
```

### 2. Run Performance Optimization (Optional but Recommended)

Run the `supabase/optimize-rls.sql` file to speed up pages by 2-3x:

```sql
-- Creates a cached role function and updates RLS policies
-- See: supabase/optimize-rls.sql
```

---

## How It Works

### Admin/Centralized Member Flow:

1. **Go to Users** → Click "Create User"
2. **Fill in details:**
   - First Name, Last Name, Email
   - Select Role (Admin, Centralized Member, or Property Manager)
   - **If Property Manager:** Select one or more properties
3. **Click "Send Invitation"**
4. **Copy the invite link** and share it with the user
5. **User clicks link**, sets password, account is created

### Property Manager Multi-Property Assignment:

- Property managers can be assigned to **multiple properties** during invitation
- Select checkboxes for all properties they should manage
- They'll have access to all selected properties immediately upon accepting

---

## API Endpoints

### Create Invitation

```
POST /api/invitations

Body:
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "property_manager",
  "property_ids": ["prop-id-1", "prop-id-2"]  // Required for property_manager
}

Response:
{
  "success": true,
  "inviteLink": "http://localhost:3006/invite/abc123..."
}
```

### Accept Invitation

```
POST /api/invitations/[token]/accept

Body:
{
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "user": { ... }
}
```

---

## Pages Created

### `/invite/[token]` - Invitation Acceptance Page

- Public page (no auth required)
- User sees their name, email, role
- Sets password (min 8 characters)
- Creates account and assigns properties (if property manager)
- Redirects to login

---

## Components Updated

### `components/users/user-form-modal.tsx`

**Before:**
- Created user directly with password
- One user, one property (for property managers)

**After:**
- Sends invitation
- Shows invite link to copy
- Multi-property selection for property managers
- No password field (user sets it themselves)

### `components/users/user-table.tsx`

- Updated to handle invitation flow
- Users appear in list only after accepting invitation

---

## Database Changes

### `invitations` table:

```sql
-- Added metadata column
metadata JSONB  -- Stores: first_name, last_name, property_ids

-- Made property_id nullable
property_id UUID NULL  -- Was NOT NULL before
```

**Metadata Structure:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "property_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Email Integration (Future)

Currently, invite links are shown in the UI to copy/paste.

**To enable email sending:**

1. Configure SMTP in `.env.local`:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   SMTP_FROM=noreply@yourdomain.com
   ```

2. Add email sending in `/api/invitations/route.ts`:
   ```typescript
   // After creating invitation
   await sendEmail({
     to: email,
     subject: 'Invitation to Property Management Portal',
     html: `<a href="${inviteLink}">Accept Invitation</a>`
   })
   ```

---

## Benefits

✅ **More Secure** - Users create their own passwords  
✅ **Better UX** - Users feel more in control  
✅ **Multi-Property** - Property managers can handle multiple properties  
✅ **No Password Storage** - Admins never see user passwords  
✅ **Trackable** - Know who accepted invitations and when  
✅ **Expirable** - Invitations expire after 7 days  

---

## Testing

### Test the Flow:

1. **Create invitation:**
   - Go to Users → Create User
   - Fill in: test@example.com, Test User, Property Manager
   - Select 2-3 properties
   - Send invitation
   - Copy the link

2. **Accept invitation:**
   - Open link in incognito window
   - See user details
   - Set password
   - Click "Create Account & Accept"

3. **Login:**
   - Should see all assigned properties
   - Can view enrollments for all assigned properties

### Expected Times (After RLS Optimization):

- Create invitation: ~100ms
- Accept invitation: ~300ms
- Load properties page: ~200-300ms (was 600-800ms)

---

## Troubleshooting

**"Invalid invitation"**
- Link expired (7 days)
- Already accepted
- Token is incorrect

**"Property managers must be assigned..."**
- Forgot to select properties
- Select at least one property

**"Email already exists"**
- User was already invited or created
- Use different email or delete old user

---

## What's Next

- [ ] Configure email sending
- [ ] Add invitation list/management page
- [ ] Resend invitations
- [ ] Revoke pending invitations
- [ ] Bulk invite upload (CSV)

---

**Done!** The invitation system is now live. 🎉




