import { Controller, UsePipes } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ParseJsonPipe, RpcZodValidationPipe } from "@cavaliercommerce/core";
import { ProductAttributesService } from "./product-attributes.service";
import { CreateProductAttributeDto } from "./dto/create-product-attribute.dto";
import { UpdateProductAttributeDto } from "./dto/update-product-attribute.dto";
import { DeleteProductAttributeDto } from "./dto/delete-product-attribute.dto";

@Controller()
@UsePipes(ParseJsonPipe, RpcZodValidationPipe)
export class ProductAttributesCommandController {
  constructor(private readonly productAttributesService: ProductAttributesService) {}

  @MessagePattern("product.attribute.create")
  async create(@Payload() data: CreateProductAttributeDto) {
    return this.productAttributesService.create(data);
  }

  @MessagePattern("product.attribute.update")
  async update(@Payload() data: UpdateProductAttributeDto) {
    return this.productAttributesService.update(data);
  }

  @MessagePattern("product.attribute.delete")
  async delete(@Payload() data: DeleteProductAttributeDto) {
    return this.productAttributesService.delete(data);
  }
}
