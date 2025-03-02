import { describe, it, expect } from "vitest";
import { UpdateProductSchema } from "../../dto/update-product.dto";

describe("UpdateProductSchema", () => {
  describe("valid data", () => {
    it("should validate with all required fields", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        version: 1,
      };

      const result = UpdateProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        version: 1,
        name: "Product name",
        shortDescription: "Short description",
        description: "Long description",
        slug: "product-slug",
      };

      const result = UpdateProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should fail with missing required fields", () => {
      const invalidData = {};

      const result = UpdateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail with invalid id format", () => {
      const invalidData = {
        id: "invalid-uuid",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        version: 1,
      };

      const result = UpdateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail with invalid tenantId format", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "invalid-uuid",
        version: 1,
      };

      const result = UpdateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail with negative version", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        version: -1,
      };

      const result = UpdateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail with empty name when provided", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        version: 1,
        name: "",
      };

      const result = UpdateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail with additional properties", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
        version: 1,
        extraField: "not allowed",
      };

      const result = UpdateProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
