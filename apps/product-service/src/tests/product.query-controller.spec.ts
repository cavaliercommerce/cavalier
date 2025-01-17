import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";
import { ProductQueryController } from "../product.query-controller";
import { ProductService } from "../product.service";

describe("Product Query (e2e)", () => {
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
      providers: [ProductService],
      controllers: [ProductQueryController],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);

    await prisma.$connect();
    await prisma.product.deleteMany({});
    await prisma.product.create({
      data: {
        name: "Stub Product 1",
        slug: "stub-product-1",
        shortDescription: "This is the first stub product",
        tenantId: "acme-corp",
      },
    });
    await prisma.product.create({
      data: {
        name: "Stub Product 2",
        slug: "stub-product-2",
        shortDescription: "This is the second stub product",
        tenantId: "acme-corp",
      },
    });
    await app.init();
  }, 300_000);

  afterAll(async () => {
    await app.close();
    await pgContainer.stop();
  });

  it("should retrieve all stub products", async () => {
    const response = await request(app.getHttpServer()).get("/products").set("X-Tenant-Id", "acme-corp");

    expect(response.status).toBe(200);
    const products = response.body;
    expect(Array.isArray(products)).toBe(true);
    expect(products).toHaveLength(2);
    expect(products[0].slug).toMatch(/stub-product/);
    expect(products[1].slug).toMatch(/stub-product/);
  });

  it("should retrieve product by slug", async () => {
    const response = await request(app.getHttpServer()).get("/products/slug/stub-product-1").set("X-Tenant-Id", "acme-corp");

    expect(response.status).toBe(200);
    const product = response.body;
    expect(product).toBeTruthy();
    expect(product.name).toBe("Stub Product 1");
  });

  it("should return 404 when slug does not exist", async () => {
    const response = await request(app.getHttpServer()).get("/products/slug/unknown-product").set("X-Tenant-Id", "acme-corp");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });

  it("should retrieve product by id", async () => {
    const [firstStub] = await prisma.product.findMany({ take: 1 });
    const response = await request(app.getHttpServer()).get(`/products/${firstStub.id}`).set("X-Tenant-Id", "acme-corp");

    expect(response.status).toBe(200);
    expect(response.body.slug).toBe(firstStub.slug);
  });

  it("should return 404 if product id does not exist", async () => {
    const response = await request(app.getHttpServer()).get("/products/bogus-id").set("X-Tenant-Id", "acme-corp");

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/not found/i);
  });
});
