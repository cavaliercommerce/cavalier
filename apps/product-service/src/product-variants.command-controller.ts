import { Controller, UsePipes } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ParseJsonPipe, RpcZodValidationPipe } from "@cavaliercommerce/core";
import { ProductVariantsService } from "./product-variants.service";
import { CreateProductVariantDto } from "./dto/create-product-variant.dto";
import { UpdateProductVariantDto } from "./dto/update-product-variant.dto";
import { DeleteProductVariantDto } from "./dto/delete-product-variant.dto";

@Controller()
@UsePipes(ParseJsonPipe, RpcZodValidationPipe)
export class ProductVariantsCommandController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @MessagePattern("product.variant.create")
  async create(@Payload() data: CreateProductVariantDto) {
    return this.productVariantsService.create(data);
  }

  @MessagePattern("product.variant.update")
  async update(@Payload() data: UpdateProductVariantDto) {
    return this.productVariantsService.update(data);
  }

  @MessagePattern("product.variant.delete")
  async delete(@Payload() data: DeleteProductVariantDto) {
    return this.productVariantsService.delete(data);
  }
}
