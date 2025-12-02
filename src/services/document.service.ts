import { eq, count, and, ilike, or, sql, inArray } from 'drizzle-orm';
import { db } from '../db';
import { documents, documentShares, documentTags, tags, users, type Document, type NewDocument } from '../db/schema';

/**
 * Document with owner and tags
 */
export interface DocumentWithDetails extends Document {
  owner: { id: string; name: string | null; email: string; avatar: string | null };
  tags: Array<{ id: string; name: string; color: string | null }>;
}

/**
 * Document service for database operations
 */
export class DocumentService {
  /**
   * Find all documents with pagination
   */
  async findAll(
    page = 1,
    pageSize = 20,
    options?: { search?: string; type?: string; folder?: string; ownerId?: string },
  ): Promise<{ documents: DocumentWithDetails[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const conditions = [];

    if (options?.search) {
      conditions.push(
        or(ilike(documents.title, `%${options.search}%`), ilike(documents.content, `%${options.search}%`)),
      );
    }
    if (options?.type) {
      conditions.push(eq(documents.type, options.type));
    }
    if (options?.folder) {
      conditions.push(eq(documents.folder, options.folder));
    }
    if (options?.ownerId) {
      conditions.push(eq(documents.ownerId, options.ownerId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const docList = await db
      .select()
      .from(documents)
      .where(whereClause)
      .limit(pageSize)
      .offset(offset)
      .orderBy(sql`${documents.createdAt} DESC`);

    const result: DocumentWithDetails[] = [];

    for (const doc of docList) {
      const [owner] = await db
        .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, doc.ownerId))
        .limit(1);

      const docTags = await db
        .select({ id: tags.id, name: tags.name, color: tags.color })
        .from(documentTags)
        .innerJoin(tags, eq(documentTags.tagId, tags.id))
        .where(eq(documentTags.documentId, doc.id));

      result.push({
        ...doc,
        owner: owner || { id: doc.ownerId, name: null, email: '', avatar: null },
        tags: docTags,
      });
    }

    const [{ value: total }] = await db.select({ value: count() }).from(documents).where(whereClause);

    return { documents: result, total };
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<DocumentWithDetails | null> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) return null;

    const [owner] = await db
      .select({ id: users.id, name: users.name, email: users.email, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, doc.ownerId))
      .limit(1);

    const docTags = await db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, doc.id));

    // Increment views
    await db
      .update(documents)
      .set({ views: (doc.views || 0) + 1 })
      .where(eq(documents.id, id));

    return {
      ...doc,
      owner: owner || { id: doc.ownerId, name: null, email: '', avatar: null },
      tags: docTags,
    };
  }

  /**
   * Create new document
   */
  async create(data: Omit<NewDocument, 'id'> & { tagIds?: string[] }): Promise<Document> {
    const { tagIds, ...docData } = data;

    const [newDoc] = await db
      .insert(documents)
      .values({ id: crypto.randomUUID(), ...docData })
      .returning();

    if (tagIds && tagIds.length > 0) {
      await db.insert(documentTags).values(tagIds.map((tagId) => ({ documentId: newDoc.id, tagId })));
    }

    return newDoc;
  }

  /**
   * Update document
   */
  async update(
    id: string,
    data: Partial<{ title: string; content: string; folder: string; type: string }>,
  ): Promise<Document | null> {
    const [updatedDoc] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();

    return updatedDoc || null;
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Batch delete documents
   */
  async batchDelete(ids: string[]): Promise<number> {
    const result = await db.delete(documents).where(inArray(documents.id, ids)).returning();
    return result.length;
  }

  /**
   * Update document tags
   */
  async updateTags(documentId: string, tagIds: string[]): Promise<void> {
    await db.delete(documentTags).where(eq(documentTags.documentId, documentId));
    if (tagIds.length > 0) {
      await db.insert(documentTags).values(tagIds.map((tagId) => ({ documentId, tagId })));
    }
  }

  /**
   * Share document
   */
  async share(
    documentId: string,
    sharedWithUserId: string,
    permission: 'read' | 'write' | 'admin' = 'read',
  ): Promise<void> {
    await db
      .insert(documentShares)
      .values({ id: crypto.randomUUID(), documentId, sharedWithUserId, permission })
      .onConflictDoNothing();
  }

  /**
   * Unshare document
   */
  async unshare(documentId: string, sharedWithUserId: string): Promise<void> {
    await db
      .delete(documentShares)
      .where(and(eq(documentShares.documentId, documentId), eq(documentShares.sharedWithUserId, sharedWithUserId)));
  }

  /**
   * Check if user is owner
   */
  async isOwner(documentId: string, userId: string): Promise<boolean> {
    const [doc] = await db
      .select({ ownerId: documents.ownerId })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    return doc?.ownerId === userId;
  }
}

// Export singleton instance
export const documentService = new DocumentService();
