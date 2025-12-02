import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { documentService } from '../services/document.service';
import { createDocumentSchema, updateDocumentSchema, paginationSchema } from '../db/schema';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

/**
 * Document routes
 */
export const documentRoutes = new Hono();

// All routes require authentication
documentRoutes.use('*', authMiddleware);

/**
 * GET /documents
 * Get documents with pagination and filters
 */
const listQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
  folder: z.string().optional(),
});

documentRoutes.get('/', zValidator('query', listQuerySchema), async (c) => {
  try {
    const { page, pageSize, search, type, folder } = c.req.valid('query');
    const user = c.get('user');

    const { documents, total } = await documentService.findAll(page, pageSize, {
      search,
      type,
      folder,
      ownerId: user.userId,
    });

    return paginatedResponse(c, documents, total, page, pageSize);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch documents', 500, 'FETCH_FAILED');
  }
});

/**
 * GET /documents/:id
 * Get document by ID
 */
documentRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const document = await documentService.findById(id);

    if (!document) {
      return errorResponse(c, 'Document not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, document);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to fetch document', 500, 'FETCH_FAILED');
  }
});

/**
 * POST /documents
 * Create new document
 */
const createSchema = createDocumentSchema.extend({
  tagIds: z.array(z.string().uuid()).optional(),
});

documentRoutes.post('/', zValidator('json', createSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const user = c.get('user');

    const document = await documentService.create({
      title: data.title,
      content: data.content || '',
      type: data.type || 'document',
      folder: data.folder,
      teamId: data.teamId,
      tagIds: data.tagIds,
      ownerId: user.userId,
    });

    return successResponse(c, document, 201);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to create document', 400, 'CREATE_FAILED');
  }
});

/**
 * PUT /documents/:id
 * Update document
 */
documentRoutes.put('/:id', zValidator('json', updateDocumentSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const data = c.req.valid('json');
    const user = c.get('user');

    // Check ownership
    const isOwner = await documentService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized to update this document', 403, 'FORBIDDEN');
    }

    const document = await documentService.update(id, data);

    if (!document) {
      return errorResponse(c, 'Document not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, document);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to update document', 400, 'UPDATE_FAILED');
  }
});

/**
 * PATCH /documents/:id/rename
 * Rename document
 */
const renameSchema = z.object({ title: z.string().min(1).max(255) });

documentRoutes.patch('/:id/rename', zValidator('json', renameSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { title } = c.req.valid('json');
    const user = c.get('user');

    const isOwner = await documentService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    const document = await documentService.update(id, { title });
    return successResponse(c, document);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to rename', 400, 'UPDATE_FAILED');
  }
});

/**
 * POST /documents/:id/move
 * Move document to folder
 */
const moveSchema = z.object({ folder: z.string().max(255) });

documentRoutes.post('/:id/move', zValidator('json', moveSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { folder } = c.req.valid('json');
    const user = c.get('user');

    const isOwner = await documentService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    const document = await documentService.update(id, { folder });
    return successResponse(c, document);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to move', 400, 'UPDATE_FAILED');
  }
});

/**
 * POST /documents/:id/tags
 * Update document tags
 */
const tagsSchema = z.object({ tagIds: z.array(z.string().uuid()) });

documentRoutes.post('/:id/tags', zValidator('json', tagsSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { tagIds } = c.req.valid('json');
    const user = c.get('user');

    const isOwner = await documentService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    await documentService.updateTags(id, tagIds);
    const document = await documentService.findById(id);
    return successResponse(c, document);
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to update tags', 400, 'UPDATE_FAILED');
  }
});

/**
 * POST /documents/:id/share
 * Share document with user
 */
const shareSchema = z.object({
  userId: z.string().uuid(),
  permission: z.enum(['read', 'write', 'admin']).default('read'),
});

documentRoutes.post('/:id/share', zValidator('json', shareSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { userId, permission } = c.req.valid('json');
    const currentUser = c.get('user');

    const isOwner = await documentService.isOwner(id, currentUser.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    await documentService.share(id, userId, permission);
    return successResponse(c, { message: 'Document shared successfully' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to share', 400, 'SHARE_FAILED');
  }
});

/**
 * POST /documents/:id/unshare
 * Remove document share
 */
const unshareSchema = z.object({ userId: z.string().uuid() });

documentRoutes.post('/:id/unshare', zValidator('json', unshareSchema), async (c) => {
  try {
    const { id } = c.req.param();
    const { userId } = c.req.valid('json');
    const currentUser = c.get('user');

    const isOwner = await documentService.isOwner(id, currentUser.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    await documentService.unshare(id, userId);
    return successResponse(c, { message: 'Share removed successfully' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to unshare', 400, 'UNSHARE_FAILED');
  }
});

/**
 * POST /documents/batch-delete
 * Batch delete documents
 */
const batchDeleteSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });

documentRoutes.post('/batch-delete', zValidator('json', batchDeleteSchema), async (c) => {
  try {
    const { ids } = c.req.valid('json');
    const count = await documentService.batchDelete(ids);

    return successResponse(c, { message: `Deleted ${count} documents` });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to delete', 400, 'DELETE_FAILED');
  }
});

/**
 * DELETE /documents/:id
 * Delete document
 */
documentRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user');

    const isOwner = await documentService.isOwner(id, user.userId);
    if (!isOwner) {
      return errorResponse(c, 'Not authorized', 403, 'FORBIDDEN');
    }

    const deleted = await documentService.delete(id);

    if (!deleted) {
      return errorResponse(c, 'Document not found', 404, 'NOT_FOUND');
    }

    return successResponse(c, { message: 'Document deleted successfully' });
  } catch (error) {
    return errorResponse(c, error instanceof Error ? error.message : 'Failed to delete', 400, 'DELETE_FAILED');
  }
});
