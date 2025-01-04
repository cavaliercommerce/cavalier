import { Controller, Get } from "@nestjs/common";
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from "@nestjs/terminus";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaService } from "src/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prismaClient: PrismaService,
    private readonly health: HealthCheckService,
    private readonly db: PrismaHealthIndicator,
  ) {}

  @Get("/readiness")
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck("database", this.prismaClient)]);
  }

  @Get("/liveness")
  @HealthCheck()
  liveness() {
    return { status: "ok" };
  }

  @Get("/")
  @HealthCheck()
  version() {
    return { version: getAppVersion() };
  }
}

function getAppVersion() {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version?: string };
  return packageJson.version || "N/A";
}
