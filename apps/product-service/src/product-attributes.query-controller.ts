import { Controller, Get, Param, UsePipes, Headers, Post, Body, Put, Delete, HttpException, HttpStatus } from "@nestjs/common";
import { HttpZodValidationPipe } from "@cavaliercommerce/core";
import { ProductAttributesService } from "./product-attributes.service";
import { CreateProductAttributeDto } from "./dto/create-product-attribute.dto";
import { UpdateProductAttributeDto } from "./dto/update-product-attribute.dto";
import { DeleteProductAttributeDto } from "./dto/delete-product-attribute.dto";

@Controller("products/:productId/attributes")
@UsePipes(HttpZodValidationPipe)
export class ProductAttributesQueryController {
  constructor(private readonly productAttributesService: ProductAttributesService) {}

  @Get()
  async findAll(@Param("productId") productId: string, @Headers("X-Tenant-Id") tenantId: string) {
    return await this.productAttributesService.findAll(productId, tenantId);
  }

  @Get(":key")
  async findOne(@Param("productId") productId: string, @Param("key") key: string, @Headers("X-Tenant-Id") tenantId: string) {
    return await this.productAttributesService.findOne(productId, tenantId, key);
  }
}
