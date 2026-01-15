# RLS Policy Guide

## What is RLS?

**Row Level Security (RLS)** is a PostgreSQL feature that lets you control which rows users can see and modify in a table. It's like having a bouncer at the database level that checks every query.

**In simple terms: RLS = Row-Level Permissions**

It's a type of permission system, but more granular than table-level permissions:
- **Table permissions**: "Can you access this table?" (all or nothing)
- **RLS policies**: "Which specific rows can you see?" (fine-grained control)

## How RLS Works

1. **Enable RLS on a table**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

2. **Create policies** that define:
   - **Who** can access (role: `authenticated`, `public`, etc.)
   - **What operation** (SELECT, INSERT, UPDATE, DELETE, or ALL)
   - **Which rows** (using a condition)

3. **Policies are combined with OR**: If ANY policy allows the operation, it's allowed.

## Policy Components

### USING Clause
- Used for: SELECT, UPDATE, DELETE
- Checks: "Can this user see/modify this row?"
- Example: `USING (id = auth.uid())` - users can only see their own rows

### WITH CHECK Clause
- Used for: INSERT, UPDATE
- Checks: "Can this user insert/update with these values?"
- Example: `WITH CHECK (role = 'admin')` - only admins can insert

## Your Current Policies

### Audits Table
Your audits table has very permissive policies:
- ✅ Public can read (SELECT) - anyone can see audit logs
- ✅ Authenticated users can insert, update, delete

**Note**: If audit logs should be read-only for most users, consider restricting SELECT to admins only.

### Main Application Tables

#### Users Table
- Admins can view all users
- Users can view themselves
- Only admins can insert/update/delete

#### Properties Table
- Admins & centralized members: See ALL properties
- Property managers: See ONLY their assigned properties
- Only admins can insert/update/delete

#### Enrollments Table
- Admins & centralized members: See ALL enrollments
- Property managers: See ONLY enrollments for their properties
- Only admins can insert/update/delete

#### Claims Table
- Admins & centralized members: See ALL claims
- Property managers: See ONLY claims for their properties
- Only admins can insert/update/delete

## Key Functions Used

### `auth.uid()`
Returns the current authenticated user's ID.

### `get_effective_user_id()` (Impersonation)
Returns the impersonated user's ID if admin is impersonating, otherwise returns `auth.uid()`.

### `get_effective_user_role()` (Impersonation)
Returns the impersonated user's role if admin is impersonating, otherwise returns the current user's role.

## Common Patterns

### Pattern 1: Role-Based Access
```sql
CREATE POLICY "Admins can view all"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### Pattern 2: Own Data Only
```sql
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

### Pattern 3: Relationship-Based (Property Managers)
```sql
CREATE POLICY "Property managers see assigned"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_managers pm
      WHERE pm.property_id = table_name.property_id
      AND pm.user_id = auth.uid()
    )
  );
```

### Pattern 4: Public Read, Authenticated Write
```sql
CREATE POLICY "Public read"
  ON table_name FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated write"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

## Viewing Your Policies

Run the SQL in `view-all-rls-policies.sql` to see all your policies:

```sql
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

## Best Practices

1. **Start restrictive, then open up**: It's easier to add permissions than remove them
2. **Test policies**: Always test with different user roles
3. **Use impersonation for testing**: Test property manager views as an admin
4. **Index columns used in policies**: Performance matters!
5. **Document complex policies**: Add comments explaining why policies exist

## Troubleshooting

### "No rows returned" but data exists
- Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Check if any policy allows your operation
- Verify your user's role matches policy conditions

### "Permission denied"
- Check if you're authenticated: `SELECT auth.uid();`
- Verify your role: `SELECT role FROM users WHERE id = auth.uid();`
- Check policy conditions match your user

### Performance issues
- Use `auth.user_role()` function (cached) instead of subqueries
- Add indexes on columns used in policy conditions
- Consider using `STABLE` functions for role checks

