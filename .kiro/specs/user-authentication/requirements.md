# Requirements Document

## Introduction

This feature adds user authentication to Gather, enabling multi-user support where each user can only access their own links and analytics. The implementation uses Supabase Auth for authentication and Row Level Security (RLS) for data isolation. This is foundational for future features like teams, API access, and billing.

## Glossary

- **Auth System**: The collection of components responsible for user registration, login, session management, and access control
- **Session**: A authenticated user's active login state, maintained via JWT tokens
- **Protected Route**: A page or API endpoint that requires authentication to access
- **Row Level Security (RLS)**: PostgreSQL feature that restricts database row access based on user identity
- **User Profile**: Additional user metadata stored alongside the auth record (display name, avatar, etc.)

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to create an account, so that I can save and manage my shortened links.

#### Acceptance Criteria

1. WHEN a user submits the registration form with valid email and password THEN the Auth System SHALL create a new user account and send a verification email
2. WHEN a user attempts to register with an already-used email THEN the Auth System SHALL display an error message indicating the email is taken
3. WHEN a user submits a password shorter than 8 characters THEN the Auth System SHALL reject the registration and display a validation error
4. WHEN a user clicks the verification link in their email THEN the Auth System SHALL mark the account as verified and redirect to the dashboard

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in to my account, so that I can access my links and analytics.

#### Acceptance Criteria

1. WHEN a user submits valid credentials THEN the Auth System SHALL create a session and redirect to the dashboard
2. WHEN a user submits invalid credentials THEN the Auth System SHALL display an error message without revealing which field is incorrect
3. WHEN a user checks "Remember me" during login THEN the Auth System SHALL persist the session for 30 days
4. WHEN a user does not check "Remember me" THEN the Auth System SHALL expire the session when the browser closes

### Requirement 3: User Logout

**User Story:** As a logged-in user, I want to log out, so that I can secure my account on shared devices.

#### Acceptance Criteria

1. WHEN a user clicks the logout button THEN the Auth System SHALL terminate the session and redirect to the login page
2. WHEN a session is terminated THEN the Auth System SHALL clear all local authentication tokens
3. WHEN a user attempts to access a protected route after logout THEN the Auth System SHALL redirect to the login page

### Requirement 4: Protected Routes

**User Story:** As a user, I want my data protected from unauthorized access, so that only I can see my links.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access the dashboard THEN the Auth System SHALL redirect to the login page
2. WHEN an unauthenticated user attempts to access link management pages THEN the Auth System SHALL redirect to the login page
3. WHEN an authenticated user accesses a protected route THEN the Auth System SHALL render the requested page
4. WHEN a session expires during use THEN the Auth System SHALL redirect to the login page and preserve the intended destination

### Requirement 5: Link Ownership

**User Story:** As a user, I want my links to be private to my account, so that other users cannot see or modify them.

#### Acceptance Criteria

1. WHEN a user creates a link THEN the Auth System SHALL associate the link with the user's ID
2. WHEN a user queries for links THEN the Auth System SHALL return only links owned by that user
3. WHEN a user attempts to access another user's link by ID THEN the Auth System SHALL return a not found response
4. WHEN a user attempts to modify another user's link THEN the Auth System SHALL reject the operation

### Requirement 6: Password Reset

**User Story:** As a user who forgot my password, I want to reset it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user requests a password reset with a valid email THEN the Auth System SHALL send a reset link to that email
2. WHEN a user requests a password reset with an unregistered email THEN the Auth System SHALL display the same success message (to prevent email enumeration)
3. WHEN a user clicks a valid reset link THEN the Auth System SHALL display a form to set a new password
4. WHEN a user submits a new password THEN the Auth System SHALL update the password and redirect to login

### Requirement 7: Auth UI Components

**User Story:** As a user, I want clear and accessible authentication forms, so that I can easily sign up and log in.

#### Acceptance Criteria

1. WHEN the login page loads THEN the Auth System SHALL display email and password fields with a submit button
2. WHEN the registration page loads THEN the Auth System SHALL display email, password, and confirm password fields
3. WHEN form validation fails THEN the Auth System SHALL display inline error messages next to the relevant fields
4. WHEN a form is submitting THEN the Auth System SHALL display a loading indicator and disable the submit button
