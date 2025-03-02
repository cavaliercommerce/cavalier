import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { HttpLoggerMiddleware } from "@cavaliercommerce/core";
import { HealthModule } from "./health/health.module";
import { ProductQueryController } from "./product.query-controller";
import { ProductCommandController } from "./product.command-controller";
import { ProductService } from "./product.service";
import { ProductAttributesQueryController } from "./product-attributes.query-controller";
import { ProductAttributesCommandController } from "./product-attributes.command-controller";
import { ProductAttributesService } from "./product-attributes.service";
import { ProductVariantsQueryController } from "./product-variants.query-controller";
import { ProductVariantsCommandController } from "./product-variants.command-controller";
import { ProductVariantsService } from "./product-variants.service";

@Module({
  imports: [PrismaModule, HealthModule],
  controllers: [
    ProductQueryController,
    ProductCommandController,
    ProductAttributesQueryController,
    ProductAttributesCommandController,
    ProductVariantsQueryController,
    ProductVariantsCommandController,
  ],
  providers: [ProductService, ProductAttributesService, ProductVariantsService],
})
export class ProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}
