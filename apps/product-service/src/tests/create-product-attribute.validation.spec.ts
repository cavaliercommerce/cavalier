import { describe, it, expect } from "vitest";
import { CreateProductAttributeDto, CreateProductAttributeSchema } from "../dto/create-product-attribute.dto";
import { ZodError } from "zod";

describe("CreateProductAttributeDto", () => {
  const validData = {
    tenantId: "123e4567-e89b-12d3-a456-426614174000",
    productId: "987fcdeb-51a2-43d7-9876-543210987654",
    version: 1,
    key: "color",
    value: "red",
  };

  it("should create a valid DTO when all properties are correct", () => {
    const dto = CreateProductAttributeSchema.parse(validData);
    expect(dto).toEqual(validData);
  });

  describe("tenantId validation", () => {
    it("should throw error when tenantId is not a UUID", () => {
      expect(() =>
        CreateProductAttributeSchema.parse({
          ...validData,
          tenantId: "not-a-uuid",
        }),
      ).toThrow(ZodError);
    });

    it("should throw error when tenantId is missing", () => {
      const { tenantId, ...dataWithoutTenantId } = validData;
      expect(() => CreateProductAttributeSchema.parse(dataWithoutTenantId)).toThrow(ZodError);
    });
  });

  describe("productId validation", () => {
    it("should throw error when productId is not a UUID", () => {
      expect(() =>
        CreateProductAttributeSchema.parse({
          ...validData,
          productId: "not-a-uuid",
        }),
      ).toThrow(ZodError);
    });

    it("should throw error when productId is missing", () => {
      const { productId, ...dataWithoutProductId } = validData;
      expect(() => CreateProductAttributeSchema.parse(dataWithoutProductId)).toThrow(ZodError);
    });
  });

  describe("version validation", () => {
    it("should throw error when version is not a positive number", () => {
      expect(() =>
        CreateProductAttributeSchema.parse({
          ...validData,
          version: 0,
        }),
      ).toThrow(ZodError);

      expect(() =>
        CreateProductAttributeSchema.parse({
          ...validData,
          version: -1,
        }),
      ).toThrow(ZodError);
    });

    it("should throw error when version is missing", () => {
      const { version, ...dataWithoutVersion } = validData;
      expect(() => CreateProductAttributeSchema.parse(dataWithoutVersion)).toThrow(ZodError);
    });
  });

  describe("key validation", () => {
    it("should throw error when key is empty string", () => {
      expect(() =>
        CreateProductAttributeSchema.parse({
          ...validData,
          key: "",
        }),
      ).toThrow(ZodError);
    });

    it("should throw error when key is missing", () => {
      const { key, ...dataWithoutKey } = validData;
      expect(() => CreateProductAttributeSchema.parse(dataWithoutKey)).toThrow(ZodError);
    });
  });

  describe("value validation", () => {
    it("should accept any type of value except null or undefined", () => {
      const testValues = ["string", 123, true, { nested: "object" }, ["array"]];

      for (const testValue of testValues) {
        expect(() =>
          CreateProductAttributeSchema.parse({
            ...validData,
            value: testValue,
          }),
        ).not.toThrow();
      }
    });

    it("should throw error when value is missing", () => {
      const { value, ...dataWithoutValue } = validData;
      expect(() => CreateProductAttributeSchema.parse(dataWithoutValue)).toThrow(ZodError);
    });

    it("should throw error when value is undefined", () => {
      expect(() => CreateProductAttributeSchema.parse({ ...validData, value: undefined })).toThrow(ZodError);
    });

    it("should throw error when value is null", () => {
      const { value, ...dataWithoutValue } = validData;
      expect(() => CreateProductAttributeSchema.parse({ ...dataWithoutValue, value: null })).toThrow(ZodError);
    });
  });

  describe("strict mode", () => {
    it("should throw error when additional properties are present", () => {
      expect(() =>
        CreateProductAttributeSchema.parse({
          ...validData,
          extraProperty: "should not be here",
        }),
      ).toThrow(ZodError);
    });
  });
});
