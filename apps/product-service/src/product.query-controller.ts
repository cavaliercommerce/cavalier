import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ProductService } from "./product.service";
import { z } from "zod";
import { ZodDto } from "nestjs-zod";

@Controller("products")
export class ProductQueryController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts() {
    return this.productService.findAll();
  }

  @Get(":id")
  async getProduct(@Param("id") id: string) {
    const product = await this.productService.findOneById(id);
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  @Get("slug/:slug")
  async getProductBySlug(@Param("slug") slug: string) {
    const product = await this.productService.findOneBySlug(slug);
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }
}
