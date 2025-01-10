import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOneById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async findOneBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
    });
  }

  async create(data: CreateProductDto) {
    try {
      return await this.prisma.product.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Slug already in use.");
      }
      throw error;
    }
  }

  async update(id: string, version: number, data: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id, version },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ConflictException("Could not update product due to version mismatch or product not found.");
      }
      throw error;
    }
  }

  async delete(id: string, version: number) {
    try {
      return await this.prisma.product.delete({
        where: { id, version },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ConflictException("Could not delete product due to version mismatch or product not found.");
      }
      throw error;
    }
  }
}
