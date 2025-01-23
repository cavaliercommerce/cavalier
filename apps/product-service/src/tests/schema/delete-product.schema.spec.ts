import { describe, it, expect } from "vitest";
import { DeleteProductSchema } from "../../dto/delete-product.dto";

describe("DeleteProductSchema", () => {
  describe("valid data", () => {
    it("should pass validation with valid data", () => {
      const validData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: 1,
        tenantId: "123e4567-e89b-12d3-a456-426614174001",
      };

      const result = DeleteProductSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("id validation", () => {
    it("should fail when id is missing", () => {
      const invalidData = {
        version: 1,
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail when id is not a valid UUID", () => {
      const invalidData = {
        id: "not-a-uuid",
        version: 1,
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("version validation", () => {
    it("should fail when version is missing", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail when version is not a number", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: "1",
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("tenantId validation", () => {
    it("should fail when tenantId is missing", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: 1,
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should fail when tenantId is not a valid UUID", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: 1,
        tenantId: "not-a-uuid",
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("strict mode", () => {
    it("should fail when additional properties are present", () => {
      const invalidData = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        version: 1,
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        extraField: "extra",
      };

      const result = DeleteProductSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
