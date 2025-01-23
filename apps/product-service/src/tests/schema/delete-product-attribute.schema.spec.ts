import { describe, it, expect } from "vitest";
import { DeleteProductAttributeSchema } from "../../dto/delete-product-attribute.dto";

describe("DeleteProductAttributeSchema", () => {
  describe("valid cases", () => {
    it("should validate correct data structure", () => {
      const validData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 1,
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("tenantId validation", () => {
    it("should reject non-uuid tenantId", () => {
      const invalidData = {
        tenantId: "invalid-uuid",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 1,
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing tenantId", () => {
      const invalidData = {
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 1,
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("productId validation", () => {
    it("should reject non-uuid productId", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "invalid-uuid",
        version: 1,
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing productId", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        version: 1,
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("version validation", () => {
    it("should reject non-positive version", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 0,
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric version", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: "1",
        key: "color",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("key validation", () => {
    it("should reject empty key", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 1,
        key: "",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing key", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 1,
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("strict mode", () => {
    it("should reject additional properties", () => {
      const invalidData = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "987fcdeb-51a2-12d3-a456-426614174000",
        version: 1,
        key: "color",
        extraField: "should not be here",
      };

      const result = DeleteProductAttributeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
