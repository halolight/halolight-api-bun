import { describe, expect, it, beforeAll } from 'bun:test';
import { hashPassword, verifyPassword } from '../../src/utils/hash';

describe('Auth Utils', () => {
  describe('Password Hashing', () => {
    const testPassword = 'testPassword123';
    let hashedPassword: string;

    beforeAll(async () => {
      hashedPassword = await hashPassword(testPassword);
    });

    it('should hash a password', async () => {
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const isValid = await verifyPassword(testPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('wrongPassword', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });
  });
});
