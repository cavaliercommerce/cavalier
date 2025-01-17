import { Controller, Get, Param, UsePipes, Headers } from "@nestjs/common";
import { ProductService } from "./product.service";
import { HttpZodValidationPipe } from "@cavaliercommerce/core";

@Controller("products")
@UsePipes(HttpZodValidationPipe)
export class ProductQueryController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts(@Headers("X-Tenant-Id") tenantId: string) {
    return this.productService.findAll(tenantId);
  }

  @Get(":id")
  async getProduct(@Param("id") id: string, @Headers("X-Tenant-Id") tenantId: string) {
    return this.productService.findOneById(id, tenantId);
  }

  @Get("slug/:slug")
  async getProductBySlug(@Param("slug") slug: string, @Headers("X-Tenant-Id") tenantId: string) {
    return this.productService.findOneBySlug(slug, tenantId);
  }
}
