import { describe, it, expect } from "vitest";
import { UpdateProductAttributeSchema } from "../../dto/update-product-attribute.dto";

describe("UpdateProductAttributeSchema", () => {
  describe("valid data", () => {
    it("should validate correct data", () => {
      const validData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-43d7-9876-543210987654",
        version: 1,
        key: "color",
        value: "red",
      };

      const result = UpdateProductAttributeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept any type for value", () => {
      const validData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-43d7-9876-543210987654",
        version: 1,
        key: "metadata",
        value: { nested: true, count: 42 },
      };

      const result = UpdateProductAttributeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should reject invalid UUID for tenantId", () => {
      const invalidData = {
        tenantId: "invalid-uuid",
        productId: "987fcdeb-51a2-43d7-9876-543210987654",
        version: 1,
        key: "color",
        value: "red",
      };

      const result = UpdateProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for productId", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "invalid-uuid",
        version: 1,
        key: "color",
        value: "red",
      };

      const result = UpdateProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative version", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-43d7-9876-543210987654",
        version: -1,
        key: "color",
        value: "red",
      };

      const result = UpdateProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty key", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-43d7-9876-543210987654",
        version: 1,
        key: "",
        value: "red",
      };

      const result = UpdateProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject additional properties", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-43d7-9876-543210987654",
        version: 1,
        key: "color",
        value: "red",
        extra: "field",
      };

      const result = UpdateProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
