import { describe, it, expect } from "vitest";
import { CreateProductSchema } from "../../dto/create-product.dto";
import { ZodError } from "zod";

describe("CreateProductDto", () => {
  const validData = {
    name: "Test Product",
    shortDescription: "Short product description",
    description: "Detailed product description",
    slug: "test-product",
    tenantId: "123e4567-e89b-12d3-a456-426614174000",
  };

  it("should create a valid DTO when all properties are provided", () => {
    const dto = CreateProductSchema.parse(validData);
    expect(dto).toEqual(validData);
  });

  it("should create a valid DTO when only required properties are provided", () => {
    const requiredData = {
      name: "Test Product",
      slug: "test-product",
      tenantId: "123e4567-e89b-12d3-a456-426614174000",
    };
    const dto = CreateProductSchema.parse(requiredData);
    expect(dto).toEqual(requiredData);
  });

  describe("name validation", () => {
    it("should throw error when name is empty string", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          name: "",
        }),
      ).toThrow(ZodError);
    });

    it("should throw error when name is missing", () => {
      const { name, ...dataWithoutName } = validData;
      expect(() => CreateProductSchema.parse(dataWithoutName)).toThrow(ZodError);
    });
  });

  describe("shortDescription validation", () => {
    it("should accept undefined for shortDescription", () => {
      const { shortDescription, ...dataWithoutShortDesc } = validData;
      expect(() => CreateProductSchema.parse(dataWithoutShortDesc)).not.toThrow();
    });

    it("should accept empty string for shortDescription", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          shortDescription: "",
        }),
      ).not.toThrow();
    });

    it("should accept valid string for shortDescription", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          shortDescription: "Valid description",
        }),
      ).not.toThrow();
    });
  });

  describe("description validation", () => {
    it("should accept undefined for description", () => {
      const { description, ...dataWithoutDesc } = validData;
      expect(() => CreateProductSchema.parse(dataWithoutDesc)).not.toThrow();
    });

    it("should accept empty string for description", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          description: "",
        }),
      ).not.toThrow();
    });

    it("should accept valid string for description", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          description: "Valid detailed description",
        }),
      ).not.toThrow();
    });
  });

  describe("slug validation", () => {
    it("should accept any non-empty string for slug", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          slug: "valid-slug",
        }),
      ).not.toThrow();
    });

    it("should accept empty string for slug", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          slug: "",
        }),
      ).not.toThrow();
    });

    it("should throw error when slug is missing", () => {
      const { slug, ...dataWithoutSlug } = validData;
      expect(() => CreateProductSchema.parse(dataWithoutSlug)).toThrow(ZodError);
    });
  });

  describe("tenantId validation", () => {
    it("should throw error when tenantId is not a valid UUID", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          tenantId: "not-a-uuid",
        }),
      ).toThrow(ZodError);
    });

    it("should throw error when tenantId is missing", () => {
      const { tenantId, ...dataWithoutTenantId } = validData;
      expect(() => CreateProductSchema.parse(dataWithoutTenantId)).toThrow(ZodError);
    });

    it("should accept valid UUID for tenantId", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          tenantId: "123e4567-e89b-12d3-a456-426614174000",
        }),
      ).not.toThrow();
    });
  });

  describe("strict mode", () => {
    it("should throw error when additional properties are present", () => {
      expect(() =>
        CreateProductSchema.parse({
          ...validData,
          extraProperty: "should not be here",
        }),
      ).toThrow(ZodError);
    });
  });
});
