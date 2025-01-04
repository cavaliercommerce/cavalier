import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { patchNestJsSwagger } from "nestjs-zod";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
