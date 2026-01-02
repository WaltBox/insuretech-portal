# Property Management Portal - Setup Guide

This guide will walk you through setting up the Property Management Portal from scratch.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18 or higher installed
- npm or yarn package manager
- A Supabase account (free tier is fine)
- Git (optional, for version control)

## Step-by-Step Setup

### Step 1: Install Dependencies

The dependencies are already installed. If you need to reinstall them:

```bash
npm install
```

### Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Project name: `property-management-portal` (or your choice)
   - Database password: Generate a strong password and save it
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for the project to be created

### Step 3: Get Supabase Credentials

Once your project is ready:

1. Go to Project Settings (gear icon in sidebar)
2. Click on "API" in the left menu
3. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
   - **service_role key** (another long string - keep this secret!)

### Step 4: Configure Environment Variables

1. Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

2. Edit `.env.local` with your credentials:

```env
# Supabase - Replace with YOUR actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=generate-a-random-secret-key-here

# Claims API (leave empty for now)
CLAIMS_API_ENDPOINT=
CLAIMS_API_KEY=

# Email (leave empty for now)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@localhost
```

**To generate JWT_SECRET:**
```bash
# Run in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Open the file `supabase/schema.sql` in your project
5. Copy ALL the contents
6. Paste into the SQL Editor
7. Click "Run" (or press Cmd/Ctrl + Enter)
8. Wait for the success message

This will create:
- All database tables (users, properties, enrollments, claims, etc.)
- Indexes for performance
- Row Level Security (RLS) policies
- Database functions
- Triggers

### Step 6: Create Your First Admin User

You need to create your admin account manually:

#### Option A: Using Supabase Dashboard

1. Go to Authentication > Users in Supabase dashboard
2. Click "Add User" > "Create new user"
3. Fill in:
   - Email: your email (e.g., `admin@yourdomain.com`)
   - Password: create a strong password
   - Auto Confirm User: ✓ (check this)
4. Click "Create User"
5. **IMPORTANT:** Copy the User ID that appears (looks like `a1b2c3d4-...`)

6. Go back to SQL Editor and run this query (replace with your values):

```sql
INSERT INTO users (id, email, role, first_name, last_name)
VALUES (
  'paste-your-user-id-here',
  'admin@yourdomain.com',
  'admin',
  'Your First Name',
  'Your Last Name'
);
```

7. Click "Run"

#### Option B: Using SQL Only

Run this in SQL Editor (replace values):

```sql
-- This uses Supabase's admin API to create both auth and database user
-- You'll need to do this via the dashboard first, then add the user record
```

### Step 7: Verify Database Setup

Run this query to verify everything is set up:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check your admin user
SELECT * FROM users WHERE role = 'admin';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

You should see:
- Tables: users, properties, enrollments, claims, invitations, property_managers
- Your admin user with role='admin'
- All tables should have rowsecurity = true

### Step 8: Run the Development Server

```bash
npm run dev
```

The server will start at [http://localhost:3000](http://localhost:3000)

### Step 9: Login

1. Open http://localhost:3000 in your browser
2. You should be redirected to the login page
3. Enter your admin email and password
4. Click "Sign in"
5. You should be redirected to `/admin/properties`

### Step 10: Test the Application

#### Create a Property

1. Click "Create Property"
2. Fill in property details:
   - Name: "Test Property" (required)
   - Address: "123 Main St" (optional)
   - City: "San Francisco" (optional)
   - State: "CA" (optional)
   - ZIP: "94102" (optional)
3. Click "Create Property"

#### Create a Test CSV File

Create a file called `test-enrollments.csv`:

```csv
Enrollment #,Status,Coverage Holder Name,First Name,Last Name,Email,Phone,Address1,City,State,ZIP,Coverage Name,Coverage Rate,Effective Date,Expiration Date,Premium Amount,Cost Amount
EN001,Premium Paying,John Doe,John,Doe,john@example.com,555-1234,123 Main St,San Francisco,CA,94102,SDI,Monthly,2024-01-01,2024-12-31,100.00,90.00
EN002,Issued, Not Paid,Jane Smith,Jane,Smith,jane@example.com,555-5678,456 Oak Ave,San Francisco,CA,94103,HO4,Annual,2024-01-15,2025-01-15,500.00,450.00
EN003,Premium Paying,Bob Johnson,Bob,Johnson,bob@example.com,555-9012,789 Pine Rd,Oakland,CA,94601,TLL,Monthly,2024-02-01,2024-12-31,75.00,65.00
```

#### Upload the CSV

1. Click on your "Test Property"
2. Scroll to "Upload Enrollments" section
3. Click "Choose File" and select your CSV
4. Click "Upload"
5. You should see "Successfully uploaded 3 enrollments"

#### View Enrollments

1. Click "View Enrollments"
2. You should see a table with 3 enrollments
3. Try the filters:
   - Search for "John"
   - Filter by status "Premium Paying"
   - Filter by coverage type "SDI"

#### Create Additional Users

1. Go to "Users" in the sidebar
2. Click "Create User"
3. Create a Centralized Member:
   - First Name: Test
   - Last Name: Member
   - Email: member@test.com
   - Password: testpassword123
   - Role: Centralized Member
4. Click "Create User"

5. Create a Property Manager:
   - First Name: Test
   - Last Name: Manager
   - Email: manager@test.com
   - Password: testpassword123
   - Role: Property Manager
6. Click "Create User"

#### Test Different User Roles

1. Logout (click logout button in sidebar)
2. Login as the Centralized Member (`member@test.com`)
   - You should see "Portfolio" in the sidebar
   - You should be able to view all properties
   - You should NOT see "Create Property" button
3. Logout and login as Property Manager (`manager@test.com`)
   - You should see "My Properties" in the sidebar
   - It should be empty (no assigned properties yet)

#### Assign Property Manager

1. Logout and login as admin again
2. Go to the property detail page
3. You should see "Property Managers" section (if implemented)
4. Or use the SQL editor:

```sql
INSERT INTO property_managers (property_id, user_id, invited_by)
VALUES (
  'your-property-id',
  'your-manager-user-id',
  'your-admin-user-id'
);
```

Now the property manager can see this property!

## Troubleshooting

### Issue: Can't login

**Solution:**
1. Check `.env.local` has correct Supabase credentials
2. Verify user exists in both `auth.users` and `public.users` tables
3. Check browser console for errors
4. Try resetting password in Supabase dashboard

### Issue: "Unauthorized" or "Forbidden" errors

**Solution:**
1. Verify RLS policies are enabled: Check SQL Editor output
2. Make sure user record exists in `public.users` with correct role
3. Check that table policies match the role
4. Try running the schema.sql again

### Issue: CSV upload fails

**Solution:**
1. Verify you're logged in as admin
2. Check CSV has all required columns:
   - Enrollment #, Status, Coverage Holder Name, First Name, Last Name, Coverage Name
3. Ensure no special characters in CSV
4. Check Supabase logs: Database > Logs

### Issue: No enrollments showing

**Solution:**
1. Check property_id in enrollments table matches your property
2. Verify RLS policies allow your user to see the data
3. Check browser console and network tab for errors
4. Try this query in SQL Editor:
```sql
SELECT * FROM enrollments WHERE property_id = 'your-property-id';
```

### Issue: Database function not found

**Solution:**
Run this specific part of schema.sql again:
```sql
CREATE OR REPLACE FUNCTION replace_property_enrollments(...)
...
```

### Issue: Pages not found (404)

**Solution:**
1. Check file names match route names
2. Verify you're in the right role (e.g., /admin/* requires admin role)
3. Clear `.next` folder and restart dev server:
```bash
rm -rf .next
npm run dev
```

## Next Steps

### Production Deployment

1. **Deploy to Vercel:**
   - Push code to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy!

2. **Update Environment Variables:**
   - Set `NEXT_PUBLIC_APP_URL` to your production URL
   - Generate new `JWT_SECRET` for production
   - Update Supabase URL if using a different project

3. **Enable Supabase Backups:**
   - Go to Project Settings > Database
   - Enable daily backups

4. **Set up Email:**
   - Configure SMTP settings for invitations
   - Or use a service like SendGrid, Resend, or AWS SES

### Optional Enhancements

- Enable email invitations by configuring SMTP
- Set up monitoring with Vercel Analytics
- Add error tracking with Sentry
- Implement audit logging
- Add data export features
- Create reports and analytics

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET
- [ ] Enabled RLS on all tables
- [ ] Service role key is in environment variables (not code)
- [ ] `.env.local` is in `.gitignore`
- [ ] Database backups enabled
- [ ] SSL/HTTPS enabled in production
- [ ] Rate limiting on auth endpoints (Supabase handles this)

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs: Database > Logs
3. Check browser console (F12) for errors
4. Review the README.md for API documentation
5. Check Supabase docs: https://supabase.com/docs

## Success!

You should now have a fully functional Property Management Portal with:
- ✅ Role-based authentication
- ✅ Property management
- ✅ CSV enrollment uploads
- ✅ Enrollment viewing with filters
- ✅ User management
- ✅ Claims viewing (ready for API integration)
- ✅ Scalable database with RLS
- ✅ Performance optimized for 24,000+ records

Happy property managing! 🏢






