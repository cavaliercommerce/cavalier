import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { patchNestJsSwagger } from "nestjs-zod";
import { z } from "zod";
import { INestApplication } from "@nestjs/common";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await validateEnvs(app);

  app.setGlobalPrefix(process.env.CONTEXT_PATH ?? "/");
  app.use(cookieParser());

  patchNestJsSwagger();

  const config = new DocumentBuilder().setTitle("Cavalier Gateway Service").setDescription("Entry-point to all cavalier services").setVersion(getAppVersion()).build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger-ui/index.html", app, document, {
    useGlobalPrefix: true,
    yamlDocumentUrl: "api-docs",
    swaggerUiEnabled: true,
  });

  await app.listen(process.env.PORT ?? 8080);
}

function getAppVersion() {
  const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version?: string };
  return packageJson.version || "N/A";
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
