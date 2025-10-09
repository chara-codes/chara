/**
 * Utility to convert Vercel AI SDK tools to Gemini FunctionDeclaration format
 * Based on: https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/blob/main/docs/zod-to-gemini-mapping.md
 */

import type { JSONSchema7, JSONSchema7TypeName } from "json-schema";
import type { ZodSchema } from "zod";

// Flexible tool interface that can handle both AI SDK formats
export interface FlexibleTool {
  type: "function";
  name: string;
  description?: string;
  parameters?: JSONSchema7; // Vercel AI SDK format
  inputSchema?: ZodSchema; // AI SDK tool() format
  execute?: (args: any) => Promise<any> | any;
}

// Gemini Schema types based on @google/genai
export interface GeminiSchema {
  type?: GeminiSchemaType;
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
  items?: GeminiSchema;
  properties?: { [key: string]: GeminiSchema };
  required?: string[];
  anyOf?: GeminiSchema[];
  default?: unknown;
  example?: unknown;

  // String constraints (note: these are strings in Gemini)
  maxLength?: string;
  minLength?: string;
  pattern?: string;

  // Number constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;

  // Array constraints (note: these are strings in Gemini)
  minItems?: string;
  maxItems?: string;
  uniqueItems?: boolean;

  // Object constraints (note: these are strings in Gemini)
  minProperties?: string;
  maxProperties?: string;
  additionalProperties?: boolean;
}

export type GeminiSchemaType =
  | "TYPE_UNSPECIFIED"
  | "STRING"
  | "NUMBER"
  | "INTEGER"
  | "BOOLEAN"
  | "ARRAY"
  | "OBJECT";

export interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: GeminiSchema;
  parametersJsonSchema?: unknown; // Alternative: standard JSON Schema
}

/**
 * Converts a Vercel AI SDK tool to Gemini FunctionDeclaration format
 * @param tool - The Vercel AI SDK tool to convert
 * @param useJsonSchema - If true, uses parametersJsonSchema instead of converting to Gemini schema
 * @returns Gemini FunctionDeclaration
 */
export function convertVercelToolToGemini(
  tool: FlexibleTool,
  useJsonSchema: boolean = false
): GeminiFunctionDeclaration {
  const result: GeminiFunctionDeclaration = {
    name: tool.name,
    description: tool.description,
  };

  // Get JSON Schema from either parameters or inputSchema
  const jsonSchema = getJsonSchemaFromTool(tool);

  if (useJsonSchema) {
    // Use JSON Schema directly (simpler approach)
    result.parametersJsonSchema = jsonSchema;
  } else {
    // Convert to Gemini's native schema format
    result.parameters = convertJSONSchemaToGeminiSchema(jsonSchema);
  }

  return result;
}

/**
 * Extracts JSON Schema from a flexible tool (handles both formats)
 * @param tool - Tool with either parameters or inputSchema
 * @returns JSON Schema
 */
function getJsonSchemaFromTool(tool: FlexibleTool): JSONSchema7 {
  if (tool.parameters) {
    return tool.parameters;
  }

  if (tool.inputSchema) {
    return zodToJsonSchema(tool.inputSchema);
  }

  // Default empty object schema
  return {
    type: "object",
    properties: {},
  };
}

/**
 * Converts Zod schema to JSON Schema
 * @param zodSchema - Zod schema to convert
 * @returns JSON Schema
 */
function zodToJsonSchema(zodSchema: ZodSchema): JSONSchema7 {
  try {
    // Try to use zod-to-json-schema if available
    // This is a simplified implementation - in a real project you'd use the library
    return convertZodToJsonSchemaSimple(zodSchema);
  } catch (error) {
    console.warn("Failed to convert Zod schema to JSON Schema:", error);
    return {
      type: "object",
      properties: {},
    };
  }
}

/**
 * Simplified Zod to JSON Schema conversion
 * This is a basic implementation - use zod-to-json-schema for production
 * @param schema - Zod schema
 * @returns JSON Schema
 */
function convertZodToJsonSchemaSimple(schema: any): JSONSchema7 {
  if (!schema._def) {
    return { type: "object", properties: {} };
  }

  const def = schema._def;

  switch (def.typeName) {
    case "ZodObject":
      const properties: Record<string, JSONSchema7> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(def.shape())) {
        properties[key] = convertZodToJsonSchemaSimple(value as any);
        // Check if the field is optional by looking at the typeName
        if ((value as any)._def.typeName !== "ZodOptional") {
          required.push(key);
        }
      }

      return {
        type: "object",
        properties,
        required: required.length > 0 ? required : undefined,
      };

    case "ZodString":
      const stringSchema: JSONSchema7 = { type: "string" };
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === "min") stringSchema.minLength = check.value;
          if (check.kind === "max") stringSchema.maxLength = check.value;
          if (check.kind === "regex") stringSchema.pattern = check.regex.source;
          if (check.kind === "email") stringSchema.format = "email";
          if (check.kind === "url") stringSchema.format = "uri";
        }
      }
      return stringSchema;

    case "ZodNumber":
      const numberSchema: JSONSchema7 = { type: "number" };
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === "min") {
            numberSchema.minimum = check.value;
            if (check.inclusive === false)
              numberSchema.exclusiveMinimum = check.inclusive;
          }
          if (check.kind === "max") {
            numberSchema.maximum = check.value;
            if (check.inclusive === false)
              numberSchema.exclusiveMaximum = check.inclusive;
          }
          if (check.kind === "int") numberSchema.type = "integer";
        }
      }
      return numberSchema;

    case "ZodBoolean":
      return { type: "boolean" };

    case "ZodArray":
      return {
        type: "array",
        items: convertZodToJsonSchemaSimple(def.type),
      };

    case "ZodEnum":
      return {
        type: "string",
        enum: def.values as string[],
      };

    case "ZodOptional":
      return convertZodToJsonSchemaSimple(def.innerType);

    case "ZodNullable":
      const innerSchema = convertZodToJsonSchemaSimple(def.innerType);
      return {
        ...innerSchema,
        type: Array.isArray(innerSchema.type)
          ? [
              ...(innerSchema.type as JSONSchema7TypeName[]),
              "null" as JSONSchema7TypeName,
            ]
          : ([
              innerSchema.type as JSONSchema7TypeName,
              "null",
            ] as JSONSchema7TypeName[]),
      };

    case "ZodUnion":
      return {
        anyOf: def.options.map((option: any) =>
          convertZodToJsonSchemaSimple(option)
        ),
      };

    default:
      return { type: "object", properties: {} };
  }
}

/**
 * Converts multiple Vercel AI SDK tools to Gemini FunctionDeclaration format
 * @param tools - Array of Vercel AI SDK tools to convert
 * @param useJsonSchema - If true, uses parametersJsonSchema instead of converting to Gemini schema
 * @returns Array of Gemini FunctionDeclarations
 */
export function convertVercelToolsToGemini(
  tools: FlexibleTool[],
  useJsonSchema: boolean = false
): GeminiFunctionDeclaration[] {
  return tools.map((tool) => convertVercelToolToGemini(tool, useJsonSchema));
}

/**
 * Converts JSON Schema to Gemini Schema format
 * @param jsonSchema - The JSON Schema to convert
 * @returns Gemini Schema
 */
export function convertJSONSchemaToGeminiSchema(
  jsonSchema: JSONSchema7
): GeminiSchema {
  // Handle boolean schemas
  if (typeof jsonSchema === "boolean") {
    return jsonSchema ? {} : { type: "TYPE_UNSPECIFIED" };
  }

  const geminiSchema: GeminiSchema = {};

  // Convert type
  if (jsonSchema.type) {
    const mappedType = mapJSONSchemaTypeToGemini(jsonSchema.type);
    if (mappedType.type) {
      geminiSchema.type = mappedType.type;
    }
    if (mappedType.nullable) {
      geminiSchema.nullable = true;
    }
  }

  // Copy description
  if (jsonSchema.description) {
    geminiSchema.description = jsonSchema.description;
  }

  // Handle enum
  if (jsonSchema.enum) {
    geminiSchema.enum = jsonSchema.enum.map(String);
    // If we don't have a type but have enum, assume STRING
    if (!geminiSchema.type && geminiSchema.enum.length > 0) {
      geminiSchema.type = "STRING";
    }
  }

  // Handle const (convert to single enum)
  if ("const" in jsonSchema && jsonSchema.const !== undefined) {
    geminiSchema.enum = [String(jsonSchema.const)];
    if (!geminiSchema.type) {
      geminiSchema.type = "STRING";
    }
  }

  // Handle default and example
  if (jsonSchema.default !== undefined) {
    geminiSchema.default = jsonSchema.default;
  }
  if ("example" in jsonSchema && jsonSchema.example !== undefined) {
    geminiSchema.example = jsonSchema.example;
  }

  // Handle format
  if (jsonSchema.format) {
    geminiSchema.format = mapFormat(jsonSchema.format);
  }

  // Type-specific conversions
  switch (geminiSchema.type) {
    case "STRING":
      convertStringConstraints(jsonSchema, geminiSchema);
      break;
    case "NUMBER":
    case "INTEGER":
      convertNumberConstraints(jsonSchema, geminiSchema);
      break;
    case "ARRAY":
      convertArrayConstraints(jsonSchema, geminiSchema);
      break;
    case "OBJECT":
      convertObjectConstraints(jsonSchema, geminiSchema);
      break;
  }

  // Handle object properties even when no type is specified
  if (!geminiSchema.type && jsonSchema.properties) {
    convertObjectConstraints(jsonSchema, geminiSchema);
  }

  // Handle anyOf/oneOf (Gemini uses anyOf)
  if (jsonSchema.anyOf || jsonSchema.oneOf) {
    const unionSchemas = jsonSchema.anyOf || jsonSchema.oneOf || [];
    geminiSchema.anyOf = unionSchemas
      .filter(
        (schema): schema is JSONSchema7 =>
          typeof schema === "object" && schema !== null
      )
      .map((schema) => convertJSONSchemaToGeminiSchema(schema));
  }

  // Handle allOf (merge properties - simplified approach)
  if (jsonSchema.allOf) {
    const validSchemas = jsonSchema.allOf.filter(
      (schema): schema is JSONSchema7 =>
        typeof schema === "object" && schema !== null
    );
    const merged = mergeAllOfSchemas(validSchemas);
    const convertedMerged = convertJSONSchemaToGeminiSchema(merged);
    // Merge the converted schema into the current one
    Object.assign(geminiSchema, convertedMerged);
  }

  return geminiSchema;
}

/**
 * Maps JSON Schema type to Gemini type
 * @param type - JSON Schema type
 * @returns Gemini type info
 */
function mapJSONSchemaTypeToGemini(
  type: JSONSchema7TypeName | JSONSchema7TypeName[]
): {
  type?: GeminiSchemaType;
  nullable?: boolean;
} {
  if (Array.isArray(type)) {
    // Handle nullable types
    const nonNullTypes = type.filter((t) => t !== "null");
    const hasNull = type.includes("null");

    if (nonNullTypes.length === 1) {
      return {
        type: mapSingleType(nonNullTypes[0]),
        nullable: hasNull,
      };
    }

    // Multiple non-null types - not directly supported
    return { type: "TYPE_UNSPECIFIED" };
  }

  if (type === null || type === undefined) {
    return { type: "TYPE_UNSPECIFIED" };
  }

  if (typeof type === "string" && type !== undefined) {
    return { type: mapSingleType(type) };
  }

  return { type: "TYPE_UNSPECIFIED" };
}

/**
 * Maps a single JSON Schema type to Gemini type
 * @param type - Single JSON Schema type
 * @returns Gemini type
 */
function mapSingleType(type: JSONSchema7TypeName): GeminiSchemaType {
  switch (type) {
    case "string":
      return "STRING";
    case "number":
      return "NUMBER";
    case "integer":
      return "INTEGER";
    case "boolean":
      return "BOOLEAN";
    case "array":
      return "ARRAY";
    case "object":
      return "OBJECT";
    case "null":
      return "TYPE_UNSPECIFIED";
    default:
      return "TYPE_UNSPECIFIED";
  }
}

/**
 * Maps JSON Schema format to Gemini format
 * @param format - JSON Schema format
 * @returns Gemini format
 */
function mapFormat(format: string): string {
  const formatMap: Record<string, string> = {
    email: "email",
    url: "uri",
    uuid: "uuid",
    "date-time": "date-time",
    date: "date",
    time: "time",
    ipv4: "ipv4",
    ipv6: "ipv6",
    // Unsupported formats default to original
  };

  return formatMap[format] || format;
}

/**
 * Converts string constraints from JSON Schema to Gemini Schema
 * @param jsonSchema - Source JSON Schema
 * @param geminiSchema - Target Gemini Schema
 */
function convertStringConstraints(
  jsonSchema: JSONSchema7,
  geminiSchema: GeminiSchema
): void {
  if (typeof jsonSchema.minLength === "number") {
    geminiSchema.minLength = String(jsonSchema.minLength);
  }
  if (typeof jsonSchema.maxLength === "number") {
    geminiSchema.maxLength = String(jsonSchema.maxLength);
  }
  if (jsonSchema.pattern) {
    geminiSchema.pattern = jsonSchema.pattern;
  }
}

/**
 * Converts number constraints from JSON Schema to Gemini Schema
 * @param jsonSchema - Source JSON Schema
 * @param geminiSchema - Target Gemini Schema
 */
function convertNumberConstraints(
  jsonSchema: JSONSchema7,
  geminiSchema: GeminiSchema
): void {
  if (typeof jsonSchema.minimum === "number") {
    geminiSchema.minimum = jsonSchema.minimum;
  }
  if (typeof jsonSchema.maximum === "number") {
    geminiSchema.maximum = jsonSchema.maximum;
  }
  if (typeof jsonSchema.exclusiveMinimum === "boolean") {
    geminiSchema.exclusiveMinimum = jsonSchema.exclusiveMinimum;
  }
  if (typeof jsonSchema.exclusiveMaximum === "boolean") {
    geminiSchema.exclusiveMaximum = jsonSchema.exclusiveMaximum;
  }
}

/**
 * Converts array constraints from JSON Schema to Gemini Schema
 * @param jsonSchema - Source JSON Schema
 * @param geminiSchema - Target Gemini Schema
 */
function convertArrayConstraints(
  jsonSchema: JSONSchema7,
  geminiSchema: GeminiSchema
): void {
  if (jsonSchema.items) {
    if (Array.isArray(jsonSchema.items)) {
      // Tuple arrays - convert to single items schema (simplified)
      if (jsonSchema.items.length > 0) {
        const firstItem = jsonSchema.items[0];
        if (typeof firstItem === "object" && firstItem !== null) {
          geminiSchema.items = convertJSONSchemaToGeminiSchema(firstItem);
        }
      }
    } else if (
      typeof jsonSchema.items === "object" &&
      jsonSchema.items !== null
    ) {
      geminiSchema.items = convertJSONSchemaToGeminiSchema(jsonSchema.items);
    }
  }

  if (typeof jsonSchema.minItems === "number") {
    geminiSchema.minItems = String(jsonSchema.minItems);
  }
  if (typeof jsonSchema.maxItems === "number") {
    geminiSchema.maxItems = String(jsonSchema.maxItems);
  }
  if (typeof jsonSchema.uniqueItems === "boolean") {
    geminiSchema.uniqueItems = jsonSchema.uniqueItems;
  }
}

/**
 * Converts object constraints from JSON Schema to Gemini Schema
 * @param jsonSchema - Source JSON Schema
 * @param geminiSchema - Target Gemini Schema
 */
function convertObjectConstraints(
  jsonSchema: JSONSchema7,
  geminiSchema: GeminiSchema
): void {
  if (jsonSchema.properties) {
    geminiSchema.properties = {};
    for (const [key, value] of Object.entries(jsonSchema.properties)) {
      if (typeof value === "object" && value !== null) {
        geminiSchema.properties[key] = convertJSONSchemaToGeminiSchema(value);
      }
    }
  }

  if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
    geminiSchema.required = jsonSchema.required;
  }

  if (typeof jsonSchema.additionalProperties === "boolean") {
    geminiSchema.additionalProperties = jsonSchema.additionalProperties;
  }

  if (typeof jsonSchema.minProperties === "number") {
    geminiSchema.minProperties = String(jsonSchema.minProperties);
  }
  if (typeof jsonSchema.maxProperties === "number") {
    geminiSchema.maxProperties = String(jsonSchema.maxProperties);
  }
}

/**
 * Merges allOf schemas into a single schema (simplified implementation)
 * @param schemas - Array of schemas to merge
 * @returns Merged schema
 */
function mergeAllOfSchemas(schemas: JSONSchema7[]): JSONSchema7 {
  const result: JSONSchema7 = {};

  for (const schema of schemas) {
    // Merge properties
    if (schema.properties) {
      result.properties = { ...result.properties, ...schema.properties };
    }

    // Merge required arrays
    if (schema.required) {
      result.required = [...(result.required || []), ...schema.required];
    }

    // Copy other properties (except properties and required which we handle specially)
    const { properties, required, ...otherProps } = schema;
    Object.assign(result, otherProps);
  }

  return result;
}

/**
 * Validates that a schema can be converted to Gemini format
 * @param jsonSchema - JSON Schema to validate
 * @returns Validation result with any issues
 */
export function validateSchemaForGeminiConversion(jsonSchema: JSONSchema7): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  function checkSchema(schema: JSONSchema7 | boolean, path: string = ""): void {
    if (typeof schema === "boolean") {
      return;
    }

    // Check for unsupported features
    if ("$ref" in schema && schema.$ref) {
      issues.push(`Unsupported $ref at ${path}: ${schema.$ref}`);
    }

    if (schema.not) {
      issues.push(`Unsupported 'not' constraint at ${path}`);
    }

    if (schema.if || schema.then || schema.else) {
      issues.push(`Unsupported conditional schema at ${path}`);
    }

    // Recursively check nested schemas
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        checkSchema(value, `${path}.${key}`);
      }
    }

    if (schema.items) {
      if (Array.isArray(schema.items)) {
        schema.items.forEach((item, index) => {
          checkSchema(item, `${path}[${index}]`);
        });
      } else {
        checkSchema(schema.items, `${path}[]`);
      }
    }

    if (schema.anyOf) {
      schema.anyOf.forEach((item, index) => {
        checkSchema(item, `${path}.anyOf[${index}]`);
      });
    }

    if (schema.oneOf) {
      schema.oneOf.forEach((item, index) => {
        checkSchema(item, `${path}.oneOf[${index}]`);
      });
    }

    if (schema.allOf) {
      schema.allOf.forEach((item, index) => {
        checkSchema(item, `${path}.allOf[${index}]`);
      });
    }
  }

  checkSchema(jsonSchema);

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Creates a simple tool for testing the conversion
 * @param name - Tool name
 * @param description - Tool description
 * @param parameters - JSON Schema parameters
 * @returns Vercel AI SDK tool
 */
export function createTestTool(
  name: string,
  description: string,
  parameters: JSONSchema7
): FlexibleTool {
  return {
    type: "function",
    name,
    description,
    parameters,
  };
}
