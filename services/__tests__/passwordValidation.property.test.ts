import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validatePassword, isPasswordValid, MIN_PASSWORD_LENGTH } from '../passwordValidation';

/**
 * **Feature: user-authentication, Property 1: Password length validation**
 * **Validates: Requirements 1.3**
 * 
 * For any password string shorter than 8 characters, the signUp function 
 * SHALL reject the registration with a validation error.
 */
describe('Password Validation Property Tests', () => {
  /**
   * Generator for passwords shorter than minimum length
   */
  const shortPasswordArb = fc.string({ minLength: 0, maxLength: MIN_PASSWORD_LENGTH - 1 });

  /**
   * Generator for passwords meeting minimum length requirement
   */
  const validLengthPasswordArb = fc.string({ minLength: MIN_PASSWORD_LENGTH, maxLength: 100 });

  /**
   * Property 1: Short passwords should be rejected
   * For any password shorter than 8 characters, validation SHALL fail
   */
  it('should reject passwords shorter than minimum length', () => {
    fc.assert(
      fc.property(
        shortPasswordArb,
        (password) => {
          const result = validatePassword(password);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.some(e => e.includes('at least'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Passwords meeting minimum length should be accepted
   * For any password with 8 or more characters, validation SHALL succeed
   */
  it('should accept passwords meeting minimum length requirement', () => {
    fc.assert(
      fc.property(
        validLengthPasswordArb,
        (password) => {
          const result = validatePassword(password);
          
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: isPasswordValid should match validatePassword result
   * For any password, isPasswordValid should return the same as validatePassword.isValid
   */
  it('should have consistent validation between isPasswordValid and validatePassword', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (password) => {
          const fullResult = validatePassword(password);
          const simpleResult = isPasswordValid(password);
          
          expect(simpleResult).toBe(fullResult.isValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Boundary test - exactly MIN_PASSWORD_LENGTH characters should be valid
   * For any password with exactly 8 characters, validation SHALL succeed
   */
  it('should accept passwords with exactly minimum length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MIN_PASSWORD_LENGTH, maxLength: MIN_PASSWORD_LENGTH }),
        (password) => {
          const result = validatePassword(password);
          
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1: Boundary test - MIN_PASSWORD_LENGTH - 1 characters should be invalid
   * For any password with exactly 7 characters, validation SHALL fail
   */
  it('should reject passwords with exactly one less than minimum length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: MIN_PASSWORD_LENGTH - 1, maxLength: MIN_PASSWORD_LENGTH - 1 }),
        (password) => {
          const result = validatePassword(password);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
