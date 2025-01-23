import { BadRequestException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { PrismaService } from "./prisma/prisma.service";
import { CreateProductAttributeDto } from "./dto/create-product-attribute.dto";
import { UpdateProductAttributeDto } from "./dto/update-product-attribute.dto";
import { DeleteProductAttributeDto } from "./dto/delete-product-attribute.dto";

@Injectable()
export class ProductAttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(productId: string, tenantId: string) {
    const product = await this.prisma.product.findUnique({ where: { id_tenantId: { id: productId, tenantId } } });
    if (!product) throw new NotFoundException("Product not found");

    return product.attributes ?? {};
  }

  async findOne(productId: string, tenantId: string, key: string) {
    const product = await this.prisma.product.findUnique({ where: { id_tenantId: { id: productId, tenantId } } });
    if (!product) throw new NotFoundException("Product not found");

    const attributes = product.attributes ?? {};
    if (!(key in attributes)) throw new NotFoundException(`Attribute '${key}' not found`);

    return { [key]: attributes[key] };
  }

  async create(dto: CreateProductAttributeDto) {
    const product = await this.prisma.product.findUnique({ where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } } });

    if (!product) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found" });
    if (product.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    const currentAttributes = product.attributes ?? {};

    if (dto.key in currentAttributes) throw new RpcException({ status: HttpStatus.CONFLICT, message: `Attribute '${dto.key}' already exists` });

    const updatedAttributes = { ...currentAttributes, [dto.key]: dto.value };

    const updatedProduct = await this.prisma.product.update({
      where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } },
      data: {
        attributes: updatedAttributes,
        version: product.version + 1,
      },
    });

    return updatedProduct;
  }

  async update(dto: UpdateProductAttributeDto) {
    const product = await this.prisma.product.findUnique({ where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } } });

    if (!product) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found" });
    if (product.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    const currentAttributes = product.attributes ?? {};

    if (!(dto.key in currentAttributes)) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Attribute '${dto.key}' does not exist` });

    const updatedAttributes = { ...currentAttributes, [dto.key]: dto.value };

    const updatedProduct = await this.prisma.product.update({
      where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } },
      data: {
        attributes: updatedAttributes,
        version: product.version + 1,
      },
    });

    return updatedProduct;
  }

  async delete(dto: DeleteProductAttributeDto) {
    const product = await this.prisma.product.findUnique({ where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } } });

    if (!product) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: "Product not found" });
    if (product.version !== dto.version) throw new RpcException({ status: HttpStatus.CONFLICT, message: "Version mismatch" });

    const currentAttributes = product.attributes ?? {};

    if (!(dto.key in currentAttributes)) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Attribute '${dto.key}' does not exist` });

    const updatedAttributes = { ...currentAttributes };
    delete updatedAttributes[dto.key];

    const updatedProduct = await this.prisma.product.update({
      where: { id_tenantId: { id: dto.productId, tenantId: dto.tenantId } },
      data: {
        attributes: updatedAttributes,
        version: product.version + 1,
      },
    });

    return updatedProduct;
  }
}
