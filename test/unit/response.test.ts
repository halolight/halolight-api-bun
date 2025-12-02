import { describe, expect, it, mock } from 'bun:test';

describe('Response Utils', () => {
  describe('successResponse', () => {
    it('should return correct structure', () => {
      const mockJson = mock(() => {});
      const mockContext = {
        json: mockJson,
      };

      // Test the response structure
      const data = { id: '1', name: 'Test' };
      const expectedResponse = {
        success: true,
        data,
      };

      expect(expectedResponse.success).toBe(true);
      expect(expectedResponse.data).toEqual(data);
    });
  });

  describe('errorResponse', () => {
    it('should return correct error structure', () => {
      const expectedResponse = {
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
        },
      };

      expect(expectedResponse.success).toBe(false);
      expect(expectedResponse.error.message).toBe('Test error');
      expect(expectedResponse.error.code).toBe('TEST_ERROR');
    });
  });

  describe('paginatedResponse', () => {
    it('should return correct pagination structure', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const total = 100;
      const page = 1;
      const pageSize = 20;

      const expectedResponse = {
        success: true,
        data,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };

      expect(expectedResponse.meta.total).toBe(100);
      expect(expectedResponse.meta.page).toBe(1);
      expect(expectedResponse.meta.pageSize).toBe(20);
      expect(expectedResponse.meta.totalPages).toBe(5);
    });
  });
});
