import { Controller, Get, Param, UsePipes, Headers } from "@nestjs/common";
import { HttpZodValidationPipe } from "@cavaliercommerce/core";
import { ProductVariantsService } from "./product-variants.service";

@Controller("products/:productId/variants")
@UsePipes(HttpZodValidationPipe)
export class ProductVariantsQueryController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @Get()
  async findAll(@Param("productId") productId: string, @Headers("X-Tenant-Id") tenantId: string) {
    return this.productVariantsService.findAll(productId, tenantId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Headers("X-Tenant-Id") tenantId: string) {
    return this.productVariantsService.findOneById(id, tenantId);
  }
}
