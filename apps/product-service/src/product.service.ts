import { Injectable, HttpStatus } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOneById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async findOneBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  async create(data: CreateProductDto) {
    if (data.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: data.slug } });
      if (existing) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Slug already in use." });
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        slug: data.slug,
      },
    });
  }

  async update(id: string, version: number, dto: Partial<UpdateProductDto>) {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found." });
    if (existing.version !== version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    if (dto.slug && dto.slug !== existing.slug) {
      const checkSlug = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (checkSlug) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Slug already in use." });
    }

    return this.prisma.product.update({
      where: { id },
      data: { ...dto, version: existing.version + 1 },
    });
  }

  async delete(id: string, version: number) {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found." });
    if (existing.version !== version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    return this.prisma.product.delete({ where: { id } });
  }
}
