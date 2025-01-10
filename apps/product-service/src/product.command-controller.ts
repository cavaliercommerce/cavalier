import { Controller, UsePipes } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ProductService } from "./product.service";
import { createZodDto, ZodValidationPipe } from "nestjs-zod";
import { z } from "zod";

const CreateProductSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
});

const UpdateProductSchema = z.object({
  id: z.string().uuid(),
  version: z.number().positive(),
  name: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  slug: z.string().optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

@Controller()
@UsePipes(ZodValidationPipe)
export class ProductCommandController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern("product.create")
  async createProduct(@Payload() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @MessagePattern("product.update")
  async updateProduct(@Payload() data: UpdateProductDto) {
    return this.productService.update(data.id, data.version, data);
  }

  @MessagePattern("product.delete")
  async deleteProduct(@Payload() data: { id: string; version: number }) {
    return this.productService.delete(data.id, data.version);
  }
}
