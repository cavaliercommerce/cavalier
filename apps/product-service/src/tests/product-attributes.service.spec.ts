import { describe, it, expect, beforeEach } from "vitest";
import { ProductAttributesService } from "../product-attributes.service";
import { PrismaService } from "../prisma/prisma.service";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";

describe("ProductAttributesService", () => {
  let service: ProductAttributesService;
  let prismaMock: DeepMockProxy<PrismaService>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaService>();
    service = new ProductAttributesService(prismaMock);
  });

  it("should retrieve attributes for a product", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red" },
    } as never);

    const result = await service.findAll("p1", "tenant-abc");
    expect(result).toEqual({ color: "red" });
  });

  it("should throw NOT_FOUND if product doesn't exist on findAll", async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);
    await expect(service.findAll("p1", "tenant-abc")).rejects.toThrow("Product not found");
  });

  it("should create a new attribute if it doesn't exist", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red" },
    } as never);

    prismaMock.product.update.mockResolvedValue({
      id: "p1",
      version: 2,
      attributes: { color: "red", size: "large" },
    } as never);

    const result = await service.create({
      productId: "p1",
      tenantId: "tenant-abc",
      version: 1,
      key: "size",
      value: "large",
    });
    expect(result.version).toBe(2);
    expect(result.attributes?.size).toBe("large");
  });

  it("should fail to create if attribute key already exists", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red" },
    } as never);

    await expect(
      service.create({
        productId: "p1",
        tenantId: "tenant-abc",
        version: 1,
        key: "color",
        value: "blue",
      }),
    ).rejects.toThrow("Attribute 'color' already exists");
  });

  it("should fail to create if version mismatch", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 2,
      attributes: {},
    } as never);

    await expect(
      service.create({
        productId: "p1",
        tenantId: "tenant-abc",
        version: 99,
        key: "size",
        value: "large",
      }),
    ).rejects.toThrow("Version mismatch");
  });

  it("should update an existing attribute", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red" },
    } as never);

    prismaMock.product.update.mockResolvedValue({
      id: "p1",
      version: 2,
      attributes: { color: "blue" },
    } as never);

    const result = await service.update({
      productId: "p1",
      tenantId: "tenant-abc",
      version: 1,
      key: "color",
      value: "blue",
    });
    expect(result.attributes?.color).toBe("blue");
  });

  it("should fail to update if key does not exist", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red" },
    } as never);

    await expect(
      service.update({
        productId: "p1",
        tenantId: "tenant-abc",
        version: 1,
        key: "size",
        value: "large",
      }),
    ).rejects.toThrow("Attribute 'size' does not exist");
  });

  it("should delete an existing attribute", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red", size: "large" },
    } as never);

    prismaMock.product.update.mockResolvedValue({
      id: "p1",
      version: 2,
      attributes: { color: "red" },
    } as never);

    const result = await service.delete({
      productId: "p1",
      tenantId: "tenant-abc",
      version: 1,
      key: "size",
    });
    expect(result.attributes).toEqual({ color: "red" });
  });

  it("should fail to delete if key does not exist", async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: "p1",
      version: 1,
      attributes: { color: "red" },
    } as never);

    await expect(
      service.delete({
        productId: "p1",
        tenantId: "tenant-abc",
        version: 1,
        key: "size",
      }),
    ).rejects.toThrow("Attribute 'size' does not exist");
  });
});
