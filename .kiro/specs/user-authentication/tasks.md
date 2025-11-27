# Implementation Plan

- [x] 1. Set up auth service infrastructure
  - [x] 1.1 Create auth service with Supabase Auth integration
    - Create `services/authService.ts` with signUp, signIn, signOut, resetPassword, updatePassword methods
    - Implement error handling and response normalization
    - _Requirements: 1.1, 2.1, 3.1, 6.1_
  - [x] 1.2 Create password validation utility
    - Create `services/passwordValidation.ts` with validatePassword function
    - Implement minimum 8 character requirement
    - _Requirements: 1.3_
  - [x] 1.3 Write property test for password validation
    - **Property 1: Password length validation**
    - **Validates: Requirements 1.3**

- [x] 2. Create Auth Context and Provider
  - [x] 2.1 Create AuthContext with React Context API
    - Create `contexts/AuthContext.tsx` with user, session, loading state
    - Implement signUp, signIn, signOut, resetPassword methods
    - Set up onAuthStateChange listener for session sync
    - _Requirements: 2.1, 3.1, 3.2_
  - [x] 2.2 Write property test for session clearing
    - **Property 2: Session clearing on logout**
    - **Validates: Requirements 3.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create auth UI pages
  - [x] 4.1 Create Login page component
    - Create `pages/Login.tsx` with email/password form
    - Add "Remember me" checkbox
    - Add link to registration and password reset
    - Implement form validation and error display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.3, 7.4_
  - [x] 4.2 Create Registration page component
    - Create `pages/Register.tsx` with email/password/confirm password form
    - Implement password validation with inline errors
    - Add link to login page
    - _Requirements: 1.1, 1.2, 1.3, 7.2, 7.3, 7.4_
  - [x] 4.3 Create Password Reset page component
    - Create `pages/ResetPassword.tsx` with email form
    - Create `pages/UpdatePassword.tsx` for setting new password
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Create Protected Route component
  - [x] 5.1 Implement ProtectedRoute HOC
    - Create `components/ProtectedRoute.tsx`
    - Check auth state and redirect unauthenticated users to login
    - Preserve intended destination for post-login redirect
    - Show loading state while checking auth
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Update database schema for user ownership
  - [x] 6.1 Add user_id column to links table
    - Create SQL migration to add user_id column
    - Add foreign key reference to auth.users
    - Create index on user_id
    - _Requirements: 5.1_
  - [x] 6.2 Enable Row Level Security policies
    - Enable RLS on links table
    - Create SELECT, INSERT, UPDATE, DELETE policies for user ownership
    - Enable RLS on click_events table with appropriate policies
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 7. Update storage adapter for user context
  - [x] 7.1 Update SupabaseAdapter to include user_id
    - Modify createLink to automatically set user_id from auth session
    - Ensure queries respect RLS (no code changes needed, RLS handles it)
    - _Requirements: 5.1, 5.2_
  - [x] 7.2 Write property test for link ownership assignment
    - **Property 3: Link ownership assignment**
    - **Validates: Requirements 5.1**
  - [x] 7.3 Write property test for data isolation
    - **Property 4: Data isolation - query filtering**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integrate auth into app routing
  - [x] 9.1 Update App.tsx with auth routes
    - Add routes for /login, /register, /reset-password, /update-password
    - Wrap protected routes with ProtectedRoute component
    - Add AuthProvider to app root
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 9.2 Add user menu to navigation
    - Update TopNavigation to show user email/avatar when logged in
    - Add logout button to user menu
    - _Requirements: 3.1_

- [x] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
