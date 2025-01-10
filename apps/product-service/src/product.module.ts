import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { PrismaModule } from "./prisma/prisma.module";
import { HttpLoggerMiddleware } from "@cavaliercommerce/core";
import { HealthModule } from "./health/health.module";
import { ProductQueryController } from "./product.query-controller";
import { ProductCommandController } from "./product.command-controller";
import { ProductService } from "./product.service";

@Module({
  imports: [PrismaModule, HealthModule],
  controllers: [ProductQueryController, ProductCommandController],
  providers: [
    ProductService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class ProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}
