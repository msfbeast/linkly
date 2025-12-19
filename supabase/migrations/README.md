# Database Migrations

This folder contains SQL migrations for the Gather database schema.

## Migrations

### 001_add_user_id_to_links.sql
Adds the `user_id` column to the `links` table to support multi-user functionality.

- Adds `user_id` UUID column with foreign key reference to `auth.users`
- Creates index on `user_id` for efficient queries

**Requirements:** 5.1 - Associate links with user's ID

### 002_enable_rls_policies.sql
Enables Row Level Security (RLS) policies for data isolation.

**Links table policies:**
- SELECT: Users can only view their own links
- INSERT: Users can only create links for themselves
- UPDATE: Users can only update their own links
- DELETE: Users can only delete their own links

**Click events table policies:**
- SELECT: Users can only view click events for their own links
- INSERT: Anyone can insert click events (for public tracking)
- DELETE: Users can delete click events for their own links

**Requirements:** 5.2, 5.3, 5.4 - Data isolation for user ownership

## How to Apply

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (001, 002, etc.)

### Using Supabase CLI
```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Important Notes

- **Existing Data:** After enabling RLS, existing links without a `user_id` will not be accessible. You may need to assign them to a user or create a migration to handle legacy data.
- **Order Matters:** Always apply migrations in numerical order.
- **Backup:** Always backup your database before applying migrations in production.
