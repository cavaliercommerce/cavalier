import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { ProductAttributesService } from "../product-attributes.service";
import { ProductAttributesQueryController } from "../product-attributes.query-controller";

describe("ProductAttributes Query (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let pgContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer("postgres").withDatabase("test_db").withUsername("test_user").withPassword("test_pass").start();

    process.env.DATABASE_URL = `postgresql://${pgContainer.getUsername()}:${pgContainer.getPassword()}@${pgContainer.getHost()}:${pgContainer.getPort()}/${pgContainer.getDatabase()}`;

    execSync("CI=true npx prisma migrate dev", {
      env: { ...process.env },
      stdio: "inherit",
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [ProductAttributesService],
      controllers: [ProductAttributesQueryController],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);

    await prisma.$connect();
    await prisma.product.deleteMany({});
    await prisma.product.create({
      data: {
        id: "product-1",
        tenantId: "acme-corp",
        version: 1,
        name: "REST Product",
        slug: "rest-product",
        attributes: { color: "red" },
      },
    });

    await app.init();
  }, 180_000);

  afterAll(async () => {
    await app.close();
    await pgContainer.stop();
  });

  it("should return all attributes", async () => {
    const res = await request(app.getHttpServer()).get("/products/product-1/attributes").set("X-Tenant-Id", "acme-corp");

    expect(res.status).toBe(200);
    expect(res.body.color).toBe("red");
  });

  it("should return single attribute", async () => {
    const res = await request(app.getHttpServer()).get("/products/product-1/attributes/color").set("X-Tenant-Id", "acme-corp");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ color: "red" });
  });

  it("should 404 if attribute does not exist", async () => {
    const res = await request(app.getHttpServer()).get("/products/product-1/attributes/size").set("X-Tenant-Id", "acme-corp");

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Attribute 'size' not found");
  });
});
