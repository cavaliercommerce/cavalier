import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { execSync } from "node:child_process";
import { firstValueFrom } from "rxjs";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RabbitMQContainer, StartedRabbitMQContainer } from "@testcontainers/rabbitmq";
import { ClientOptions, ClientProxy, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ProductService } from "../product.service";
import { ProductCommandController } from "../product.command-controller";

const RMQ_PORT = 5672;

describe("Product Command (e2e)", () => {
  let app: INestApplication;
  let pgContainer: StartedPostgreSqlContainer;
  let rabbitMQContainer: StartedRabbitMQContainer;
  let prisma: PrismaService;
  let client: ClientProxy;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer("postgres").withDatabase("test_db").withUsername("test_user").withPassword("test_pass").start();
    rabbitMQContainer = await new RabbitMQContainer("rabbitmq:4-management").withExposedPorts(RMQ_PORT, 15672).start();

    process.env.DATABASE_URL = `postgresql://${pgContainer.getUsername()}:${pgContainer.getPassword()}@${pgContainer.getHost()}:${pgContainer.getPort()}/${pgContainer.getDatabase()}`;
    process.env.RABBITMQ_URL = `amqp://guest:guest@${rabbitMQContainer.getHost()}:${rabbitMQContainer.getMappedPort(RMQ_PORT)}`;

    execSync("CI=true npx prisma migrate dev", {
      env: { ...process.env },
      stdio: "inherit",
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [ProductService],
      controllers: [ProductCommandController],
    }).compile();

    app = moduleFixture.createNestApplication();
    const options: ClientOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL ?? "amqp://localhost:5672"],
        queue: "products.commands",
        queueOptions: {
          durable: true,
        },
        noAck: true,
      },
    };

    app.connectMicroservice(options);

    await app.startAllMicroservices();
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    client = ClientProxyFactory.create(options);
  }, 300_000);

  afterAll(async () => {
    await app.close();
    await rabbitMQContainer.stop();
    await pgContainer.stop();
  });

  it("should create a product", async () => {
    const createPayload = {
      name: "Created By Command",
      slug: "command-slug-create",
      shortDescription: "This product is created via RMQ",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const createdProduct = await firstValueFrom(client.send("product.create", createPayload));
    const productInDb = await prisma.product.findUnique({
      where: { id: createdProduct.id },
    });

    expect(createdProduct).toBeTruthy();
    expect(productInDb).toBeTruthy();
    expect(productInDb?.name).toBe("Created By Command");
    expect(productInDb?.slug).toBe("command-slug-create");
  });

  it("should update a product", async () => {
    const { id, version } = await prisma.product.create({
      data: {
        name: "Needs Update",
        slug: "some-slug",
        shortDescription: "Will be updated",
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
    const updatePayload = {
      id,
      version,
      name: "Updated By Command",
      shortDescription: "Now updated via RMQ",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const updatedProduct = await firstValueFrom(client.send("product.update", updatePayload));
    const productInDb = await prisma.product.findUnique({
      where: { id },
    });

    expect(updatedProduct).toBeTruthy();
    expect(updatedProduct.name).toBe("Updated By Command");
    expect(updatedProduct.version).toBe(version + 1);
    expect(productInDb).toBeTruthy();
    expect(productInDb?.name).toBe("Updated By Command");
    expect(productInDb?.version).toBe(version + 1);
  });

  it("should delete a product", async () => {
    const { id, version } = await prisma.product.create({
      data: {
        name: "Temporary Product",
        slug: "temp-product",
        shortDescription: "Will be deleted",
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });

    const deletePayload = { id, version, tenantId: "550e8400-e29b-41d4-a716-446655440000" };
    const deletedProduct = await firstValueFrom(client.send("product.delete", deletePayload));
    const productInDb = await prisma.product.findUnique({
      where: { id },
    });

    expect(deletedProduct).toBeTruthy();
    expect(deletedProduct.id).toBe(id);
    expect(productInDb).toBeNull();
  });

  it("should fail to create product if 'name' is missing", async () => {
    const invalidPayload = { slug: "bad-request-slug", tenantId: "550e8400-e29b-41d4-a716-446655440000" };
    await expect(firstValueFrom(client.send("product.create", invalidPayload))).rejects.toThrow("Validation failed");
  });

  it("should fail to create product if slug is already used", async () => {
    const slug = "duplicate-slug";
    await prisma.product.create({
      data: {
        name: "First With This Slug",
        slug,
        tenantId: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
    const payload = {
      name: "Second Product with same slug",
      slug,
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(firstValueFrom(client.send("product.create", payload))).rejects.toThrow("Slug already in use");
  });

  it("should fail to update product if version is mismatched", async () => {
    const { id, version } = await prisma.product.create({
      data: { name: "Updatable Product", slug: "version-mismatch", tenantId: "550e8400-e29b-41d4-a716-446655440000" },
    });
    const mismatchedVersionPayload = {
      id,
      version: version + 999,
      name: "Should Not Work",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(firstValueFrom(client.send("product.update", mismatchedVersionPayload))).rejects.toThrow("Version mismatch");
  });

  it("should fail to delete product if version is mismatched", async () => {
    const { id, version } = await prisma.product.create({
      data: { name: "Deletable Product", slug: "will-fail-delete", tenantId: "550e8400-e29b-41d4-a716-446655440000" },
    });

    const mismatchedDeletePayload = { id, version: version + 999, tenantId: "550e8400-e29b-41d4-a716-446655440000" };
    await expect(firstValueFrom(client.send("product.delete", mismatchedDeletePayload))).rejects.toThrow("Version mismatch");
  });

  it("should handle parse error if invalid JSON is passed as string", async () => {
    const malformedJsonPayload = '{ "name": "No closing brace" ';
    await expect(firstValueFrom(client.send("product.create", malformedJsonPayload))).rejects.toThrow("Invalid JSON");
  });

  it("should not allow updating product with slug that already exists", async () => {
    await prisma.product.create({ data: { name: "P1", slug: "unique-slug-1", version: 1, tenantId: "550e8400-e29b-41d4-a716-446655440000" } });
    const product2 = await prisma.product.create({ data: { name: "P2", slug: "unique-slug-2", version: 1, tenantId: "550e8400-e29b-41d4-a716-446655440000" } });
    const updatePayload = {
      id: product2.id,
      version: product2.version,
      slug: "unique-slug-1",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(firstValueFrom(client.send("product.update", updatePayload))).rejects.toThrow("Slug already in use");
  });

  it("should change the slug of existing product to a new one", async () => {
    const product = await prisma.product.create({
      data: { name: "Will Change Slug", slug: "old-slug", version: 1, tenantId: "550e8400-e29b-41d4-a716-446655440000" },
    });
    const updatePayload = {
      id: product.id,
      version: product.version,
      slug: "new-slug",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    const updated = await firstValueFrom(client.send("product.update", updatePayload));
    expect(updated.slug).toBe("new-slug");
  });

  it("should not allow passing more properties than required by dto on product.create", async () => {
    const createPayload = {
      name: "Extra Props Product",
      slug: "extra-props",
      randomProp: 12345,
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(firstValueFrom(client.send("product.create", createPayload))).rejects.toThrow("Validation failed");
  });

  it("should not allow passing more properties than required by dto on product.update", async () => {
    const product = await prisma.product.create({ data: { name: "Has Extra Props", slug: "has-extra-props", version: 1, tenantId: "550e8400-e29b-41d4-a716-446655440000" } });
    const updatePayload = {
      id: product.id,
      version: product.version,
      name: "New Name",
      randomProp: "abc",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(firstValueFrom(client.send("product.update", updatePayload))).rejects.toThrow("Validation failed");
  });

  it("should not allow passing more properties than required by dto on product.delete", async () => {
    const product = await prisma.product.create({ data: { name: "Delete Extra Props", slug: "delete-extra-props", version: 1, tenantId: "550e8400-e29b-41d4-a716-446655440000" } });
    const deletePayload = {
      id: product.id,
      version: product.version,
      randomProp: "extra",
      tenantId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(firstValueFrom(client.send("product.delete", deletePayload))).rejects.toThrow("Validation failed");
  });
});
