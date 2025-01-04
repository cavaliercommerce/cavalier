import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import dotenv from "dotenv";
import { z } from "zod";
import { INestApplication } from "@nestjs/common";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await validateEnvs(app);

  app.setGlobalPrefix(process.env.CONTEXT_PATH ?? "/");

  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();

export async function validateEnvs(app: INestApplication) {
  const envSchema = z.object({
    PORT: z.string().transform(Number).pipe(z.number().positive()),
    CONTEXT_PATH: z.string().startsWith("/"),
    DATABASE_URL: z.string(),
  });

  const { success, error } = envSchema.safeParse(process.env);

  if (!success) {
    console.error(`Invalid environment variables ${JSON.stringify(error, null, 2)}`);
    await app.close();
    process.exit(1);
  }
}
