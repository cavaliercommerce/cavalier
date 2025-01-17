import { describe, it, expect, beforeEach } from "vitest";
import { ProductService } from "../product.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";

describe("ProductService", () => {
  let productService: ProductService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaService>();
    productService = new ProductService(prismaMock);
  });

  it("should find all products", async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    const result = await productService.findAll("acme-corp");
    expect(result).toEqual([]);
  });

  it("should find product by id", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "abc" } as never);
    const product = await productService.findOneById("abc", "acme-corp");
    expect(product).toEqual({ id: "abc" });
  });

  it("should create product successfully", async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);
    prismaMock.product.create.mockResolvedValue({ id: "new-id", name: "New" } as never);
    const result = await productService.create({ name: "New", slug: "test-slug", tenantId: "acme-corp" });
    expect(result).toEqual({ id: "new-id", name: "New" });
  });

  it("should handle slug conflict on create", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id" } as never);
    await expect(productService.create({ name: "Duplicate Slug", slug: "existing-slug", tenantId: "acme-corp" })).rejects.toThrow("Slug already in use");
  });

  it("should update product successfully", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id", version: 1, slug: "some-slug" } as never);
    prismaMock.product.update.mockResolvedValue({ id: "some-id", version: 2 } as never);
    const result = await productService.update({ id: "some-id", version: 1, name: "Updated", slug: "some-slug", tenantId: "acme-corp" });
    expect(result).toEqual({ id: "some-id", version: 2 });
  });

  it("should throw conflict on update if version mismatch", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id", version: 1, slug: "test-slug" } as never);
    await expect(productService.update({ id: "some-id", version: 999, name: "Fail", tenantId: "acme-corp" })).rejects.toThrow("Version mismatch");
  });

  it("should handle slug conflict on update", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: "some-id", version: 1, slug: "old-slug" } as never);
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: "another-id" } as never);
    await expect(productService.update({ id: "some-id", version: 1, slug: "existing-slug", tenantId: "acme-corp" })).rejects.toThrow("Slug already in use");
  });

  it("should delete product successfully", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "deleted-id", version: 1 } as never);
    prismaMock.product.delete.mockResolvedValue({ id: "deleted-id" } as never);
    const result = await productService.delete({ id: "deleted-id", version: 1, tenantId: "acme-corp" });
    expect(result).toEqual({ id: "deleted-id" });
  });

  it("should throw conflict on delete if version mismatch", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id", version: 1 } as never);
    await expect(productService.delete({ id: "some-id", version: 999, tenantId: "acme-corp" })).rejects.toThrow("Version mismatch");
  });

  it("should throw exception if tenantId is missing in findAll", async () => {
    await expect(productService.findAll(undefined as never)).rejects.toThrow("TenantId is missing");
  });

  it("should throw exception if tenantId is missing in findOneById", async () => {
    await expect(productService.findOneById("abc", undefined as never)).rejects.toThrow("TenantId is missing");
  });

  it("should throw exception if tenantId is missing in findOneBySlug", async () => {
    await expect(productService.findOneBySlug("abc", undefined as never)).rejects.toThrow("TenantId is missing");
  });

  it("should throw exception if trying to update non-existent product", async () => {
    await expect(productService.update({ id: "non-existent-id", version: 1, name: "Updated", slug: "some-slug", tenantId: "acme-corp" })).rejects.toThrow("Product not found");
  });

  it("should throw exception if trying to delete non-existent product", async () => {
    await expect(productService.delete({ id: "non-existent-id", version: 1, tenantId: "acme-corp" })).rejects.toThrow("Product not found");
  });
});
