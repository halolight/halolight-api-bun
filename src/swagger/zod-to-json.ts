import type { ZodTypeAny, ZodObject } from 'zod';

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  format?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  default?: unknown;
  description?: string;
};

/**
 * Convert Zod schema to JSON Schema (simplified version)
 * For full conversion, consider using zod-to-json-schema package
 */
export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema {
  const def = schema._def;

  // Handle ZodObject
  if (def.typeName === 'ZodObject') {
    const shape = (schema as ZodObject<Record<string, ZodTypeAny>>).shape;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value;
      properties[key] = zodToJsonSchema(fieldSchema);

      // Check if field is required (not optional)
      if (fieldSchema._def.typeName !== 'ZodOptional') {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
    };
  }

  // Handle ZodString
  if (def.typeName === 'ZodString') {
    const result: JsonSchema = { type: 'string' };
    const checks = def.checks || [];

    for (const check of checks) {
      if (check.kind === 'email') {
        result.format = 'email';
      } else if (check.kind === 'url') {
        result.format = 'uri';
      } else if (check.kind === 'uuid') {
        result.format = 'uuid';
      } else if (check.kind === 'min') {
        result.minLength = check.value;
      } else if (check.kind === 'max') {
        result.maxLength = check.value;
      }
    }

    return result;
  }

  // Handle ZodNumber
  if (def.typeName === 'ZodNumber') {
    const result: JsonSchema = { type: 'number' };
    const checks = def.checks || [];

    for (const check of checks) {
      if (check.kind === 'int') {
        result.type = 'integer';
      } else if (check.kind === 'min') {
        result.minimum = check.value;
      } else if (check.kind === 'max') {
        result.maximum = check.value;
      }
    }

    return result;
  }

  // Handle ZodBoolean
  if (def.typeName === 'ZodBoolean') {
    return { type: 'boolean' };
  }

  // Handle ZodEnum
  if (def.typeName === 'ZodEnum') {
    return {
      type: 'string',
      enum: def.values,
    };
  }

  // Handle ZodOptional
  if (def.typeName === 'ZodOptional') {
    return zodToJsonSchema(def.innerType as ZodTypeAny);
  }

  // Handle ZodNullable
  if (def.typeName === 'ZodNullable') {
    return zodToJsonSchema(def.innerType as ZodTypeAny);
  }

  // Handle ZodArray
  if (def.typeName === 'ZodArray') {
    return {
      type: 'array',
      items: zodToJsonSchema(def.type as ZodTypeAny),
    };
  }

  // Handle ZodDefault
  if (def.typeName === 'ZodDefault') {
    const innerSchema = zodToJsonSchema(def.innerType as ZodTypeAny);
    return {
      ...innerSchema,
      default: (def.defaultValue as () => unknown)(),
    };
  }

  // Handle ZodEffects (transforms, refinements)
  if (def.typeName === 'ZodEffects') {
    return zodToJsonSchema(def.schema as ZodTypeAny);
  }

  // Default fallback
  return { type: 'string' };
}
