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
    const result = await productService.findAll();
    expect(result).toEqual([]);
  });

  it("should find product by id", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "abc" } as never);
    const product = await productService.findOneById("abc");
    expect(product).toEqual({ id: "abc" });
  });

  it("should create product successfully", async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);
    prismaMock.product.create.mockResolvedValue({ id: "new-id", name: "New" } as never);
    const result = await productService.create({ name: "New", slug: "test-slug" });
    expect(result).toEqual({ id: "new-id", name: "New" });
  });

  it("should handle slug conflict on create", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id" } as never);
    await expect(productService.create({ name: "Duplicate Slug", slug: "existing-slug" })).rejects.toThrow("Slug already in use");
  });

  it("should update product successfully", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id", version: 1, slug: "some-slug" } as never);
    prismaMock.product.update.mockResolvedValue({ id: "some-id", version: 2 } as never);
    const result = await productService.update("some-id", 1, { name: "Updated", slug: "some-slug" });
    expect(result).toEqual({ id: "some-id", version: 2 });
  });

  it("should throw conflict on update if version mismatch", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id", version: 1, slug: "test-slug" } as never);
    await expect(productService.update("some-id", 999, { name: "Fail" })).rejects.toThrow("Version mismatch");
  });

  it("should handle slug conflict on update", async () => {
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: "some-id", version: 1, slug: "old-slug" } as never);
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: "another-id" } as never);
    await expect(productService.update("some-id", 1, { slug: "existing-slug" })).rejects.toThrow("Slug already in use");
  });

  it("should delete product successfully", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "deleted-id", version: 1 } as never);
    prismaMock.product.delete.mockResolvedValue({ id: "deleted-id" } as never);
    const result = await productService.delete("deleted-id", 1);
    expect(result).toEqual({ id: "deleted-id" });
  });

  it("should throw conflict on delete if version mismatch", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: "some-id", version: 1 } as never);
    await expect(productService.delete("some-id", 999)).rejects.toThrow("Version mismatch");
  });
});
