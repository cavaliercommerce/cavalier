import { Injectable, HttpStatus, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { CreateProductVariantDto } from "./dto/create-product-variant.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";
import { DeleteProductVariantDto } from "./dto/delete-product-variant.dto";
import { RpcException } from "@nestjs/microservices";
import * as R from "remeda";

@Injectable()
export class ProductVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string, tenantId: string) {
    if (!tenantId) throw new BadRequestException("TenantId is missing");

    const product = await this.prisma.product.findUnique({
      where: { id_tenantId: { id: productId, tenantId } },
      include: { variants: true },
    });

    if (!product) throw new NotFoundException("Product not found");

    return product.variants;
  }

  async findOneById(id: string, tenantId: string) {
    if (!tenantId) throw new BadRequestException("TenantId is missing");

    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id,
        product: {
          tenantId,
        },
      },
    });

    if (!variant) throw new NotFoundException("Product variant not found");

    return variant;
  }

  async create(dto: CreateProductVariantDto) {
    const product = await this.prisma.product.findUnique({
      where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } },
    });

    if (!product) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found" });
    if (product.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    if (dto.sku) {
      const existingSku = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (existingSku) throw new RpcException({ status: HttpStatus.CONFLICT, message: "SKU already in use" });
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        productId: dto.productId,
        name: dto.name,
        sku: dto.sku,
        prices: { create: dto.prices },
      },
    });

    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { version: product.version + 1 },
    });

    return variant;
  }

  async update(dto: UpdateProductVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.id },
      include: { product: true, prices: true },
    });

    if (!variant) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product variant not found" });
    if (variant.product.tenantId !== dto.tenantId) throw new RpcException({ status: HttpStatus.FORBIDDEN, message: "Tenant mismatch" });
    if (variant.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (existingSku) throw new RpcException({ status: HttpStatus.CONFLICT, message: "SKU already in use" });
    }

    const updatedVariant = await this.prisma.productVariant.update({
      where: { id: dto.id },
      data: {
        ...R.omit(dto, ["id", "version", "tenantId", "productId", "prices"]),
        prices: dto.prices
          ? {
              upsert: dto.prices.map((price) => ({
                where: { productVariantId_currency: { productVariantId: dto.id, currency: price.currency } },
                create: price,
                update: price,
              })),
            }
          : undefined,
        version: variant.version + 1,
      },
    });

    await this.prisma.product.update({
      where: { id: variant.productId },
      data: { version: variant.product.version + 1 },
    });

    return updatedVariant;
  }

  async delete(dto: DeleteProductVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.id },
      include: { product: true },
    });

    if (!variant) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product variant not found" });
    if (variant.product.tenantId !== dto.tenantId) throw new RpcException({ status: HttpStatus.FORBIDDEN, message: "Tenant mismatch" });
    if (variant.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    const deletedVariant = await this.prisma.productVariant.delete({ where: { id: dto.id } });

    await this.prisma.product.update({
      where: { id: variant.productId },
      data: { version: variant.product.version + 1 },
    });

    return deletedVariant;
  }
}
