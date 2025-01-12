import { Controller, UsePipes } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { ProductService } from "./product.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ParseJsonPipe, ZodValidationPipe } from "@cavaliercommerce/core";

@Controller()
@UsePipes(ParseJsonPipe, ZodValidationPipe)
export class ProductCommandController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern("product.create")
  async createProduct(@Payload() data: CreateProductDto, @Ctx() ctx: RmqContext) {
    const channel = ctx.getChannelRef();
    const originalMsg = ctx.getMessage();

    try {
      const updated = await this.productService.create(data);

      channel.ack(originalMsg);

      return updated;
    } catch (error) {
      channel.nack(originalMsg);
      throw error;
    }
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
