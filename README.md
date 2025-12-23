# Property Management Portal

A scalable property management portal built with Next.js, Supabase, and React Query for viewing tenant enrollments and insurance claims across multiple properties with role-based access control.

## Features

- **Role-Based Access Control**
  - Admin (God-Mode): Full system access
  - Centralized Members: View all properties and enrollments
  - Property Managers: View assigned properties only

- **Property Management**
  - Create, edit, delete properties (Admin only)
  - View property details and statistics
  - CSV upload for bulk enrollment import

- **Enrollment Management**
  - View enrollments with pagination and filtering
  - Search by name, email, enrollment number
  - Filter by status and coverage type
  - Optimized for 24,000+ records with cursor-based pagination

- **Claims Management**
  - View claims across properties
  - Filter and search claims
  - Role-based claim visibility

- **User Management**
  - Create and manage users (Admin only)
  - Invite property managers to specific properties
  - Role assignment and permissions

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ultra-genius-caf
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Run the database schema:
   - Open the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/schema.sql`
   - Execute the SQL to create all tables, indexes, RLS policies, and functions

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key

# Claims API (optional - for future integration)
CLAIMS_API_ENDPOINT=
CLAIMS_API_KEY=

# Email (optional - for invitations)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@localhost
```

### 5. Create Initial Admin User

After setting up the database, you need to create your first admin user manually:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" and create a user with email/password
3. Copy the User ID
4. Go to SQL Editor and run:

```sql
INSERT INTO users (id, email, role, first_name, last_name)
VALUES ('your_user_id', 'admin@example.com', 'admin', 'Admin', 'User');
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Login

Use the email and password you created for the admin user to login.

## Project Structure

```
ultra-genius-caf/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── admin/            # Admin-only pages
│   │   ├── portfolio/        # Centralized member pages
│   │   ├── my-properties/    # Property manager pages
│   │   ├── claims/           # Claims pages
│   │   └── dashboard/        # Main dashboard
│   ├── api/                  # API routes
│   ├── login/                # Login page
│   └── layout.tsx            # Root layout
├── components/
│   ├── auth/                 # Authentication components
│   ├── claims/               # Claims components
│   ├── enrollments/          # Enrollment components
│   ├── layout/               # Layout components
│   ├── properties/           # Property components
│   └── users/                # User management components
├── lib/
│   ├── supabase/             # Supabase client utilities
│   ├── providers/            # React providers
│   ├── auth.ts               # Auth helper functions
│   └── types.ts              # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema
└── README.md
```

## User Roles

### Admin
- Full system access
- Create/edit/delete properties
- Upload CSV enrollments
- Manage users
- Assign property managers
- View all data

### Centralized Member
- View all properties
- View all enrollments
- View all claims
- Invite property managers
- Cannot upload CSVs or manage properties

### Property Manager
- View assigned properties only
- View enrollments for assigned properties
- View claims for assigned properties
- No administrative capabilities

## CSV Upload Format

The enrollment CSV should include these columns:

**Required:**
- Enrollment #
- Status
- Coverage Holder Name
- First Name
- Last Name
- Coverage Name

**Optional:**
- Email
- Phone
- Address1, Address2, City, State, ZIP
- Coverage Rate
- Effective Date, Expiration Date, Paid To Date
- Premium Amount, Cost Amount
- Producer Name, Reference ID, Note
- Payment Source, Creation Source

## Performance Optimization

The system is optimized to handle 24,000+ enrollments:

- **Cursor-based pagination** for efficient data loading
- **Database indexes** on frequently queried columns
- **Full-text search** using PostgreSQL tsvector
- **Row Level Security** for automatic data filtering
- **React Query** for client-side caching
- **Virtual scrolling** ready (can be added with @tanstack/react-virtual)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Database Backups

Enable automated backups in Supabase:
- Go to Project Settings > Database
- Configure backup schedule

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property (admin)
- `GET /api/properties/[id]` - Get property
- `PUT /api/properties/[id]` - Update property (admin)
- `DELETE /api/properties/[id]` - Delete property (admin)

### Enrollments
- `GET /api/properties/[id]/enrollments` - List enrollments
- `POST /api/properties/[id]/enrollments/upload` - Upload CSV (admin)

### Claims
- `GET /api/claims` - List claims

### Users
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/[id]` - Update user (admin)
- `DELETE /api/users/[id]` - Delete user (admin)

### Property Managers
- `POST /api/properties/[id]/managers/invite` - Invite manager
- `GET /api/properties/[id]/managers` - List managers
- `DELETE /api/properties/[id]/managers` - Remove manager

## Future Enhancements

- [ ] Email notifications for invitations
- [ ] Claims API integration (when available)
- [ ] Export enrollments to CSV
- [ ] PDF report generation
- [ ] Admin impersonation feature
- [ ] Audit logging
- [ ] Advanced analytics dashboard
- [ ] Mobile responsive optimization
- [ ] Dark mode

## Troubleshooting

### Can't login?
- Verify your Supabase credentials in `.env.local`
- Check that the user exists in both auth.users and public.users tables
- Ensure RLS policies are enabled

### CSV upload fails?
- Verify required columns are present
- Check that you're logged in as an admin
- Review the schema.sql for the `replace_property_enrollments` function

### Slow performance?
- Check database indexes are created
- Verify RLS policies are optimized
- Consider enabling Supabase read replicas for production

## Support

For issues or questions, please check:
1. Supabase logs (Database > Logs)
2. Browser console for errors
3. Network tab for API failures

## License

MIT
