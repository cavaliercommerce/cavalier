import { NestFactory } from "@nestjs/core";
import { ProductModule } from "./product.module";
import dotenv from "dotenv";
import { z } from "zod";
import { INestApplication } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import path from "node:path";

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

async function bootstrap() {
  const app = await NestFactory.create(ProductModule);
  await validateEnvs(app);

  app.setGlobalPrefix(process.env.CONTEXT_PATH ?? "/");
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? "amqp://localhost:5672"],
      queue: "products.commands",
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 8081);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

export async function validateEnvs(app: INestApplication) {
  const envSchema = z.object({
    PORT: z.string().transform(Number).pipe(z.number().positive()),
    CONTEXT_PATH: z.string().startsWith("/"),
    DATABASE_URL: z.string(),
    RABBITMQ_URL: z.string().optional(),
  });

  const { success, error } = envSchema.safeParse(process.env);

  if (!success) {
    console.error(`Invalid environment variables: ${JSON.stringify(error, null, 2)}`);
    await app.close();
    process.exit(1);
  }
}
