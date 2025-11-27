/**
 * Password validation utility
 * Requirements: 1.3 - Password must be at least 8 characters
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Minimum password length requirement
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate a password against security requirements
 * 
 * @param password - The password to validate
 * @returns Validation result with isValid flag and any error messages
 * 
 * Requirements: 1.3 - WHEN a user submits a password shorter than 8 characters 
 * THEN the Auth System SHALL reject the registration and display a validation error
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length requirement (Requirement 1.3)
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a password meets the minimum length requirement
 * 
 * @param password - The password to check
 * @returns true if password is valid, false otherwise
 */
export function isPasswordValid(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
