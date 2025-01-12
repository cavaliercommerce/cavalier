import { Controller, UsePipes } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ParseJsonPipe, ZodValidationPipe } from "@cavaliercommerce/core";

@Controller()
@UsePipes(ParseJsonPipe, ZodValidationPipe)
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
