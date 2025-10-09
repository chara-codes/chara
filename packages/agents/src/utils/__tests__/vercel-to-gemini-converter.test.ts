import { describe, expect, test } from "bun:test";
import type { JSONSchema7 } from "json-schema";
import {
  convertJSONSchemaToGeminiSchema,
  convertVercelToolsToGemini,
  convertVercelToolToGemini,
  createTestTool,
  validateSchemaForGeminiConversion,
  type FlexibleTool,
  type GeminiFunctionDeclaration,
  type GeminiSchema,
} from "../vercel-to-gemini-converter";

describe("Vercel to Gemini Converter", () => {
  describe("convertVercelToolToGemini", () => {
    test("should convert basic tool with string parameter", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "testTool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to process",
            },
          },
          required: ["message"],
        },
      };

      const result = convertVercelToolToGemini(tool);

      expect(result).toEqual({
        name: "testTool",
        description: "A test tool",
        parameters: {
          type: "OBJECT",
          properties: {
            message: {
              type: "STRING",
              description: "The message to process",
            },
          },
          required: ["message"],
        },
      });
    });

    test("should use JSON schema when useJsonSchema is true", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "testTool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      };

      const result = convertVercelToolToGemini(tool, true);

      expect(result).toEqual({
        name: "testTool",
        description: "A test tool",
        parametersJsonSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      });
    });

    test("should handle tool without description", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "testTool",
        parameters: {
          type: "object",
          properties: {},
        },
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.name).toBe("testTool");
      expect(result.description).toBeUndefined();
      expect(result.parameters).toBeDefined();
    });
  });

  describe("convertVercelToolsToGemini", () => {
    test("should convert multiple tools", () => {
      const tools: FlexibleTool[] = [
        {
          type: "function",
          name: "tool1",
          parameters: { type: "object", properties: {} },
        },
        {
          type: "function",
          name: "tool2",
          parameters: { type: "object", properties: {} },
        },
      ];

      const result = convertVercelToolsToGemini(tools);

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe("tool1");
      expect(result[1]?.name).toBe("tool2");
    });
  });

  describe("convertJSONSchemaToGeminiSchema", () => {
    test("should handle boolean schemas", () => {
      expect(convertJSONSchemaToGeminiSchema(true as any)).toEqual({});
      expect(convertJSONSchemaToGeminiSchema(false as any)).toEqual({
        type: "TYPE_UNSPECIFIED",
      });
    });

    test("should convert primitive types", () => {
      expect(convertJSONSchemaToGeminiSchema({ type: "string" })).toEqual({
        type: "STRING",
      });

      expect(convertJSONSchemaToGeminiSchema({ type: "number" })).toEqual({
        type: "NUMBER",
      });

      expect(convertJSONSchemaToGeminiSchema({ type: "integer" })).toEqual({
        type: "INTEGER",
      });

      expect(convertJSONSchemaToGeminiSchema({ type: "boolean" })).toEqual({
        type: "BOOLEAN",
      });

      expect(convertJSONSchemaToGeminiSchema({ type: "array" })).toEqual({
        type: "ARRAY",
      });

      expect(convertJSONSchemaToGeminiSchema({ type: "object" })).toEqual({
        type: "OBJECT",
      });
    });

    test("should handle nullable types", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: ["string", "null"],
      });

      expect(result).toEqual({
        type: "STRING",
        nullable: true,
      });
    });

    test("should convert string constraints", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "string",
        minLength: 5,
        maxLength: 100,
        pattern: "^[A-Z]",
        description: "A string field",
      });

      expect(result).toEqual({
        type: "STRING",
        minLength: "5",
        maxLength: "100",
        pattern: "^[A-Z]",
        description: "A string field",
      });
    });

    test("should convert number constraints", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "number",
        minimum: 0,
        maximum: 100,
        exclusiveMinimum: true,
        exclusiveMaximum: false,
      });

      expect(result).toEqual({
        type: "NUMBER",
        minimum: 0,
        maximum: 100,
        exclusiveMinimum: true,
        exclusiveMaximum: false,
      });
    });

    test("should convert array constraints", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      });

      expect(result).toEqual({
        type: "ARRAY",
        items: { type: "STRING" },
        minItems: "1",
        maxItems: "10",
        uniqueItems: true,
      });
    });

    test("should handle tuple arrays", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "array",
        items: [{ type: "string" }, { type: "number" }],
      });

      expect(result).toEqual({
        type: "ARRAY",
        items: { type: "STRING" }, // Simplified to first item
      });
    });

    test("should convert object constraints", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "object",
        properties: {
          name: { type: "string", description: "User name" },
          age: { type: "number", minimum: 0 },
        },
        required: ["name"],
        additionalProperties: false,
        minProperties: 1,
        maxProperties: 10,
      });

      expect(result).toEqual({
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "User name" },
          age: { type: "NUMBER", minimum: 0 },
        },
        required: ["name"],
        additionalProperties: false,
        minProperties: "1",
        maxProperties: "10",
      });
    });

    test("should handle enum values", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "string",
        enum: ["option1", "option2", "option3"],
      });

      expect(result).toEqual({
        type: "STRING",
        enum: ["option1", "option2", "option3"],
      });
    });

    test("should handle const values", () => {
      const result = convertJSONSchemaToGeminiSchema({
        const: "fixed-value",
      });

      expect(result).toEqual({
        type: "STRING",
        enum: ["fixed-value"],
      });
    });

    test("should handle anyOf unions", () => {
      const result = convertJSONSchemaToGeminiSchema({
        anyOf: [{ type: "string" }, { type: "number" }],
      });

      expect(result).toEqual({
        anyOf: [{ type: "STRING" }, { type: "NUMBER" }],
      });
    });

    test("should handle oneOf unions", () => {
      const result = convertJSONSchemaToGeminiSchema({
        oneOf: [{ type: "string" }, { type: "number" }],
      });

      expect(result).toEqual({
        anyOf: [{ type: "STRING" }, { type: "NUMBER" }],
      });
    });

    test("should handle allOf merging", () => {
      const result = convertJSONSchemaToGeminiSchema({
        allOf: [
          {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
          {
            type: "object",
            properties: {
              age: { type: "number" },
            },
            required: ["age"],
          },
        ],
      });

      expect(result).toEqual({
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          age: { type: "NUMBER" },
        },
        required: ["name", "age"],
      });
    });

    test("should handle format mapping", () => {
      const testCases: Array<[string, string]> = [
        ["email", "email"],
        ["url", "uri"],
        ["uuid", "uuid"],
        ["date-time", "date-time"],
        ["date", "date"],
        ["time", "time"],
        ["ipv4", "ipv4"],
        ["ipv6", "ipv6"],
        ["custom-format", "custom-format"], // Unsupported formats pass through
      ];

      for (const [input, expected] of testCases) {
        const result = convertJSONSchemaToGeminiSchema({
          type: "string",
          format: input,
        });

        expect(result.format).toBe(expected);
      }
    });

    test("should handle complex nested schema", () => {
      const complexSchema: JSONSchema7 = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: {
                type: "string",
                minLength: 1,
                maxLength: 50,
              },
              contacts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["email", "phone"],
                    },
                    value: { type: "string" },
                  },
                  required: ["type", "value"],
                },
                minItems: 1,
              },
            },
            required: ["name"],
          },
          settings: {
            anyOf: [
              { type: "null" },
              {
                type: "object",
                properties: {
                  theme: { type: "string", enum: ["light", "dark"] },
                },
              },
            ],
          },
        },
        required: ["user"],
      };

      const result = convertJSONSchemaToGeminiSchema(complexSchema);

      expect(result).toEqual({
        type: "OBJECT",
        properties: {
          user: {
            type: "OBJECT",
            properties: {
              name: {
                type: "STRING",
                minLength: "1",
                maxLength: "50",
              },
              contacts: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: {
                      type: "STRING",
                      enum: ["email", "phone"],
                    },
                    value: { type: "STRING" },
                  },
                  required: ["type", "value"],
                },
                minItems: "1",
              },
            },
            required: ["name"],
          },
          settings: {
            anyOf: [
              { type: "TYPE_UNSPECIFIED" },
              {
                type: "OBJECT",
                properties: {
                  theme: {
                    type: "STRING",
                    enum: ["light", "dark"],
                  },
                },
              },
            ],
          },
        },
        required: ["user"],
      });
    });

    test("should handle default and example values", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "string",
        default: "default-value",
      });

      expect(result).toEqual({
        type: "STRING",
        default: "default-value",
      });
    });
  });

  describe("validateSchemaForGeminiConversion", () => {
    test("should validate simple valid schema", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };

      const result = validateSchemaForGeminiConversion(schema);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test("should detect unsupported $ref", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          user: { $ref: "#/definitions/User" },
        },
      };

      const result = validateSchemaForGeminiConversion(schema);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        "Unsupported $ref at .user: #/definitions/User"
      );
    });

    test("should detect unsupported not constraint", () => {
      const schema: JSONSchema7 = {
        type: "string",
        not: { enum: ["forbidden"] },
      };

      const result = validateSchemaForGeminiConversion(schema);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Unsupported 'not' constraint at ");
    });

    test("should detect unsupported conditional schemas", () => {
      const schema: JSONSchema7 = {
        type: "object",
        if: { properties: { type: { const: "special" } } },
        then: { required: ["special-field"] },
        else: { required: ["normal-field"] },
      };

      const result = validateSchemaForGeminiConversion(schema);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Unsupported conditional schema at ");
    });

    test("should detect nested unsupported features", () => {
      const schema: JSONSchema7 = {
        type: "object",
        properties: {
          nested: {
            type: "object",
            properties: {
              ref: { $ref: "#/definitions/Something" },
            },
          },
        },
      };

      const result = validateSchemaForGeminiConversion(schema);

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        "Unsupported $ref at .nested.ref: #/definitions/Something"
      );
    });
  });

  describe("createTestTool", () => {
    test("should create a valid test tool", () => {
      const parameters: JSONSchema7 = {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      };

      const tool = createTestTool("testTool", "A test tool", parameters);

      expect(tool).toEqual({
        type: "function",
        name: "testTool",
        description: "A test tool",
        parameters,
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty object schema", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "object",
        properties: {},
      });

      expect(result).toEqual({
        type: "OBJECT",
        properties: {},
      });
    });

    test("should handle schema with no type but with properties", () => {
      const result = convertJSONSchemaToGeminiSchema({
        properties: {
          name: { type: "string" },
        },
      });

      expect(result).toEqual({
        properties: {
          name: { type: "STRING" },
        },
      });
    });

    test("should handle multiple array types (unsupported)", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: ["string", "number", "boolean"],
      });

      expect(result).toEqual({
        type: "TYPE_UNSPECIFIED",
      });
    });

    test("should handle empty anyOf/oneOf arrays", () => {
      const result = convertJSONSchemaToGeminiSchema({
        anyOf: [],
      });

      expect(result).toEqual({
        anyOf: [],
      });
    });

    test("should handle enum without type", () => {
      const result = convertJSONSchemaToGeminiSchema({
        enum: ["a", "b", "c"],
      });

      expect(result).toEqual({
        type: "STRING",
        enum: ["a", "b", "c"],
      });
    });

    test("should handle empty enum", () => {
      const result = convertJSONSchemaToGeminiSchema({
        type: "string",
        enum: [],
      });

      expect(result).toEqual({
        type: "STRING",
        enum: [],
      });
    });
  });

  describe("Integration Tests", () => {
    test("should convert real-world weather tool", () => {
      const weatherTool = createTestTool(
        "get_weather",
        "Get current weather information for a location",
        {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and country, e.g. San Francisco, CA",
              minLength: 2,
              maxLength: 100,
            },
            units: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              default: "celsius",
              description: "Temperature units",
            },
            include_forecast: {
              type: "boolean",
              default: false,
              description: "Whether to include forecast data",
            },
          },
          required: ["location"],
        }
      );

      const converted = convertVercelToolToGemini(weatherTool);

      expect(converted.name).toBe("get_weather");
      expect(converted.description).toBe(
        "Get current weather information for a location"
      );
      expect(converted.parameters?.type).toBe("OBJECT");
      expect(converted.parameters?.required).toEqual(["location"]);
      expect(converted.parameters?.properties?.location).toEqual({
        type: "STRING",
        description: "The city and country, e.g. San Francisco, CA",
        minLength: "2",
        maxLength: "100",
      });
      expect(converted.parameters?.properties?.units).toEqual({
        type: "STRING",
        enum: ["celsius", "fahrenheit"],
        default: "celsius",
        description: "Temperature units",
      });
      expect(converted.parameters?.properties?.include_forecast).toEqual({
        type: "BOOLEAN",
        default: false,
        description: "Whether to include forecast data",
      });
    });

    test("should convert file operation tool with complex structure", () => {
      const fileOpTool = createTestTool(
        "file_operation",
        "Perform file operations",
        {
          type: "object",
          properties: {
            operation: {
              type: "string",
              enum: ["read", "write", "delete", "list"],
            },
            path: {
              type: "string",
              pattern: "^[^\0]+$",
              minLength: 1,
            },
            options: {
              anyOf: [
                { type: "null" },
                {
                  type: "object",
                  properties: {
                    encoding: {
                      type: "string",
                      enum: ["utf8", "ascii", "base64"],
                      default: "utf8",
                    },
                    recursive: { type: "boolean" },
                    filters: {
                      type: "array",
                      items: { type: "string" },
                      maxItems: 10,
                    },
                  },
                },
              ],
            },
          },
          required: ["operation", "path"],
        }
      );

      const converted = convertVercelToolToGemini(fileOpTool);

      expect(converted.name).toBe("file_operation");
      expect(converted.parameters?.type).toBe("OBJECT");
      expect(converted.parameters?.required).toEqual(["operation", "path"]);
      expect(converted.parameters?.properties?.options?.anyOf).toHaveLength(2);
    });
  });

  describe("AI SDK Tools with Zod Schemas", () => {
    test("should convert tool with Zod string schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodStringTool",
        description: "A tool with Zod string schema",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              message: {
                _def: {
                  typeName: "ZodString",
                  checks: [
                    { kind: "min", value: 1 },
                    { kind: "max", value: 100 },
                  ],
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.name).toBe("zodStringTool");
      expect(result.parameters?.type).toBe("OBJECT");
      expect(result.parameters?.properties?.message?.type).toBe("STRING");
      expect(result.parameters?.properties?.message?.minLength).toBe("1");
      expect(result.parameters?.properties?.message?.maxLength).toBe("100");
    });

    test("should convert tool with Zod number schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodNumberTool",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              count: {
                _def: {
                  typeName: "ZodNumber",
                  checks: [
                    { kind: "min", value: 0, inclusive: true },
                    { kind: "max", value: 1000, inclusive: false },
                    { kind: "int" },
                  ],
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.parameters?.properties?.count?.type).toBe("INTEGER");
      expect(result.parameters?.properties?.count?.minimum).toBe(0);
      expect(result.parameters?.properties?.count?.maximum).toBe(1000);
      expect(result.parameters?.properties?.count?.exclusiveMaximum).toBe(
        false
      );
    });

    test("should convert tool with Zod enum schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodEnumTool",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              status: {
                _def: {
                  typeName: "ZodEnum",
                  values: ["active", "inactive", "pending"],
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.parameters?.properties?.status?.type).toBe("STRING");
      expect(result.parameters?.properties?.status?.enum).toEqual([
        "active",
        "inactive",
        "pending",
      ]);
    });

    test("should convert tool with Zod array schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodArrayTool",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              tags: {
                _def: {
                  typeName: "ZodArray",
                  type: {
                    _def: {
                      typeName: "ZodString",
                    },
                  },
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.parameters?.properties?.tags?.type).toBe("ARRAY");
      expect(result.parameters?.properties?.tags?.items?.type).toBe("STRING");
    });

    test("should convert tool with Zod optional schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodOptionalTool",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              required_field: {
                _def: {
                  typeName: "ZodString",
                },
              },
              optional_field: {
                _def: {
                  typeName: "ZodOptional",
                  innerType: {
                    _def: {
                      typeName: "ZodString",
                    },
                  },
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.parameters?.properties?.required_field?.type).toBe(
        "STRING"
      );
      expect(result.parameters?.properties?.optional_field?.type).toBe(
        "STRING"
      );
      expect(result.parameters?.required).toEqual(["required_field"]);
    });

    test("should convert tool with Zod nullable schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodNullableTool",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              nullable_field: {
                _def: {
                  typeName: "ZodNullable",
                  innerType: {
                    _def: {
                      typeName: "ZodString",
                    },
                  },
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.parameters?.properties?.nullable_field?.type).toBe(
        "STRING"
      );
      expect(result.parameters?.properties?.nullable_field?.nullable).toBe(
        true
      );
    });

    test("should convert tool with Zod union schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "zodUnionTool",
        inputSchema: {
          _def: {
            typeName: "ZodObject",
            shape: () => ({
              value: {
                _def: {
                  typeName: "ZodUnion",
                  options: [
                    {
                      _def: {
                        typeName: "ZodString",
                      },
                    },
                    {
                      _def: {
                        typeName: "ZodNumber",
                      },
                    },
                  ],
                },
              },
            }),
          },
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.parameters?.properties?.value?.anyOf).toHaveLength(2);
      expect(result.parameters?.properties?.value?.anyOf?.[0]?.type).toBe(
        "STRING"
      );
      expect(result.parameters?.properties?.value?.anyOf?.[1]?.type).toBe(
        "NUMBER"
      );
    });

    test("should handle tool with no schema gracefully", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "noSchemaTool",
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.name).toBe("noSchemaTool");
      expect(result.parameters?.type).toBe("OBJECT");
      expect(result.parameters?.properties).toEqual({});
    });

    test("should handle tool with malformed Zod schema", () => {
      const tool: FlexibleTool = {
        type: "function",
        name: "malformedTool",
        inputSchema: {
          // Intentionally malformed - missing _def
        } as any,
      };

      const result = convertVercelToolToGemini(tool);

      expect(result.name).toBe("malformedTool");
      expect(result.parameters?.type).toBe("OBJECT");
      expect(result.parameters?.properties).toEqual({});
    });
  });
});
