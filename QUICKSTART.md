# Quick Start Guide

Get the Property Management Portal running in **10 minutes**.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Supabase account (free tier works)
- [ ] Text editor (VS Code recommended)

## 5 Steps to Launch

### Step 1: Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - Name: `property-portal`
   - Password: (generate and save it)
   - Region: (closest to you)
4. Click **"Create new project"** and wait ~2 minutes

### Step 2: Get Credentials (1 minute)

1. In Supabase, go to **Settings** (gear icon) → **API**
2. Copy these 3 values:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

### Step 3: Configure Environment (1 minute)

1. In your project, create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3006
JWT_SECRET=run_this_command_to_generate_secret
```

2. Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as JWT_SECRET value.

### Step 4: Set Up Database (3 minutes)

1. In Supabase, click **SQL Editor** (lightning icon)
2. Click **"New Query"**
3. Open `supabase/schema.sql` in your project
4. Copy **ALL** the content (it's long, make sure you get everything)
5. Paste into SQL Editor
6. Click **"Run"** (or Cmd/Ctrl + Enter)
7. Wait for **"Success. No rows returned"**

### Step 5: Create Admin User (3 minutes)

#### Option A: Using Dashboard (Easier)

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Fill in:
   - Email: `admin@yourcompany.com` (use your real email)
   - Password: (create a strong password)
   - ✅ Auto Confirm User (check this!)
4. Click **"Create User"**
5. **COPY THE USER ID** (looks like: `a1b2c3d4-1234-5678-...`)

6. Go to **SQL Editor** and run this (replace the values):

```sql
INSERT INTO users (id, email, role, first_name, last_name)
VALUES (
  'PASTE_YOUR_USER_ID_HERE',
  'admin@yourcompany.com',
  'admin',
  'Your First Name',
  'Your Last Name'
);
```

#### Option B: Quick SQL (Advanced)

If you're comfortable with SQL, you can do it all at once, but you'll need to manually confirm the email in Supabase Auth afterwards.

## Launch! 🚀

```bash
npm run dev
```

Open [http://localhost:3006](http://localhost:3006)

## First Login

1. Login with your admin email and password
2. You should see the Properties dashboard
3. Click **"Create Property"** to add your first property

## Test CSV Upload

Create a file called `test.csv`:

```csv
Enrollment #,Status,Coverage Holder Name,First Name,Last Name,Email,Coverage Name
EN001,Premium Paying,John Doe,John,Doe,john@test.com,SDI
EN002,Issued, Not Paid,Jane Smith,Jane,Smith,jane@test.com,HO4
```

1. Click on your property
2. Upload the CSV
3. Click "View Enrollments"

## Create Test Users

1. Go to **Users** in the sidebar
2. Create a **Centralized Member**:
   - Email: `member@test.com`
   - Password: `Test123456!`
   - Role: Centralized Member
3. Create a **Property Manager**:
   - Email: `manager@test.com`
   - Password: `Test123456!`
   - Role: Property Manager

## Test Different Roles

1. Logout (bottom of sidebar)
2. Login as `member@test.com` → Can view all properties
3. Logout
4. Login as `manager@test.com` → No properties yet (needs assignment)
5. Login back as admin to assign properties to manager

## Troubleshooting

### "Unauthorized" error
- Check `.env.local` has correct Supabase credentials
- Verify user exists in both Authentication and Users table

### CSV upload fails
- Ensure required columns: `Enrollment #`, `Status`, `Coverage Holder Name`, `First Name`, `Last Name`, `Coverage Name`
- Check you're logged in as admin

### Can't see data
- Verify RLS policies were created (check SQL Editor output)
- Check user role in database: `SELECT * FROM users WHERE email = 'your@email.com';`

## Next Steps

✅ You're ready! Read the full [SETUP.md](./SETUP.md) for detailed documentation.

### Recommended:
- Add real property data
- Invite property managers
- Set up email (optional)
- Deploy to Vercel (optional)

## Support

- **Setup Issues?** → Check [SETUP.md](./SETUP.md)
- **Feature Questions?** → Check [README.md](./README.md)
- **Database Issues?** → Check Supabase Dashboard → Database → Logs

---

**Total Time:** ~10 minutes  
**Result:** Fully functional property management portal! 🎉


