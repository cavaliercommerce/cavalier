import { Injectable, HttpStatus, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { RpcException } from "@nestjs/microservices";
import { DeleteProductDto } from "./dto/delete-product.dto";
import * as R from "remeda";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    if (!tenantId) throw new BadRequestException("TenantId is missing");

    return this.prisma.product.findMany({ where: { tenantId: tenantId } });
  }

  async findOneById(id: string, tenantId: string) {
    if (!tenantId) throw new BadRequestException("TenantId is missing");

    const product = await this.prisma.product.findUnique({ where: { id_tenantId: { tenantId, id } } });
    if (!product) throw new NotFoundException("Product not found");

    return product;
  }

  async findOneBySlug(slug: string, tenantId: string) {
    if (!tenantId) throw new BadRequestException("TenantId is missing");

    const product = await this.prisma.product.findUnique({ where: { tenantId_slug: { tenantId, slug } } });
    if (!product) throw new NotFoundException("Product not found");

    return product;
  }

  async create(data: CreateProductDto) {
    if (data.slug) {
      const existing = await this.prisma.product.findUnique({ where: { tenantId_slug: { tenantId: data.tenantId, slug: data.slug } } });
      if (existing) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Slug already in use." });
    }

    return this.prisma.product.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        slug: data.slug,
      },
    });
  }

  async update(dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id_tenantId: { tenantId: dto.tenantId, id: dto.id } } });

    if (!existing) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found." });
    if (existing.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    if (dto.slug && dto.slug !== existing.slug) {
      const checkSlug = await this.prisma.product.findUnique({ where: { tenantId_slug: { tenantId: dto.tenantId, slug: dto.slug } } });
      if (checkSlug) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Slug already in use." });
    }

    return this.prisma.product.update({
      where: { id: dto.id },
      data: { ...R.omit(dto, ["id", "version", "tenantId"]), version: existing.version + 1 },
    });
  }

  async delete(dto: DeleteProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id_tenantId: { tenantId: dto.tenantId, id: dto.id } } });

    if (!existing) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found." });
    if (existing.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    return this.prisma.product.delete({ where: { id_tenantId: { tenantId: dto.tenantId, id: dto.id } } });
  }
}
