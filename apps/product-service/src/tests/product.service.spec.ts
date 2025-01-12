import { describe, it, expect, beforeEach } from "vitest";
import { ProductService } from "../product.service";
import { Prisma } from "@prisma/client";
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
    prismaMock.product!.findMany!.mockResolvedValue([]);
    const result = await productService.findAll();
    expect(result).toEqual([]);
  });

  it("should find product by id", async () => {
    prismaMock.product!.findUnique!.mockResolvedValue({ id: "abc" } as never);
    const product = await productService.findOneById("abc");
    expect(product).toEqual({ id: "abc" });
  });

  it("should create product successfully", async () => {
    prismaMock.product!.create!.mockResolvedValue({ id: "new-id", name: "New" } as never);
    const result = await productService.create({ name: "New" });
    expect(result).toEqual({ id: "new-id", name: "New" });
  });

  it("should handle slug conflict on create", async () => {
    prismaMock.product!.create!.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "4.0.0",
      }),
    );
    await expect(productService.create({ name: "Duplicate Slug" })).rejects.toThrow("Slug already in use.");
  });

  it("should update product successfully", async () => {
    prismaMock.product!.update!.mockResolvedValue({ id: "some-id", version: 2 } as never);
    const result = await productService.update("some-id", 1, { name: "Updated" });
    expect(result).toEqual({ id: "some-id", version: 2 });
  });

  it("should throw conflict on update if version mismatch", async () => {
    prismaMock.product!.update!.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "4.0.0",
      }),
    );
    await expect(productService.update("bad-id", 99, { name: "Fail" })).rejects.toThrow("Could not update product due to version mismatch or product not found.");
  });

  it("should delete product successfully", async () => {
    prismaMock.product!.delete!.mockResolvedValue({ id: "deleted-id" } as never);
    const result = await productService.delete("deleted-id", 1);
    expect(result).toEqual({ id: "deleted-id" });
  });

  it("should throw conflict on delete if version mismatch", async () => {
    prismaMock.product!.delete!.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "4.0.0",
      }),
    );
    await expect(productService.delete("bad-id", 99)).rejects.toThrow("Could not delete product due to version mismatch or product not found.");
  });
});
