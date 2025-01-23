import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { execSync } from "node:child_process";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RabbitMQContainer, StartedRabbitMQContainer } from "@testcontainers/rabbitmq";
import { ClientOptions, ClientProxy, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import { ProductAttributesService } from "../product-attributes.service";
import { ProductAttributesCommandController } from "../product-attributes.command-controller";
import { firstValueFrom } from "rxjs";

const RMQ_PORT = 5672;

describe("ProductAttributes Command (e2e)", () => {
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
      providers: [ProductAttributesService],
      controllers: [ProductAttributesCommandController],
    }).compile();

    app = moduleFixture.createNestApplication();

    const rmqOptions: ClientOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: "products.commands",
        queueOptions: { durable: true },
        noAck: true,
      },
    };
    app.connectMicroservice(rmqOptions);

    await app.startAllMicroservices();
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    client = ClientProxyFactory.create(rmqOptions);

    await prisma.product.deleteMany({});
    await prisma.product.create({
      data: {
        id: "2face165-5345-4cf3-ab05-5421a6b19df2",
        tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
        version: 1,
        name: "Test Product",
        slug: "test-product",
      },
    });
  }, 180_000);

  afterAll(async () => {
    await client.close();
    await rabbitMQContainer.stop();
    await pgContainer.stop();
    await app.close();
  });

  it("should create a new attribute on product", async () => {
    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 1,
      key: "color",
      value: "red",
    };

    const result = await firstValueFrom(client.send("product.attribute.create", payload));
    expect(result.attributes.color).toBe("red");
    expect(result.version).toBe(2);
  });

  it("should fail to create attribute if key already exists", async () => {
    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 2,
      key: "color",
      value: "blue",
    };

    await expect(firstValueFrom(client.send("product.attribute.create", payload))).rejects.toThrow("already exists");
  });

  it("should update an existing attribute", async () => {
    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 2,
      key: "color",
      value: "green",
    };

    const result = await firstValueFrom(client.send("product.attribute.update", payload));
    expect(result.attributes.color).toBe("green");
    expect(result.version).toBe(3);
  });

  it("should fail to update if attribute does not exist", async () => {
    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 3,
      key: "size",
      value: "XL",
    };

    await expect(firstValueFrom(client.send("product.attribute.update", payload))).rejects.toThrow("does not exist");
  });

  it("should delete an existing attribute", async () => {
    await prisma.product.update({
      where: { id_tenantId: { tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964", id: "2face165-5345-4cf3-ab05-5421a6b19df2" } },
      data: {
        attributes: { color: "green", size: "L" },
        version: 4,
      },
    });

    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 4,
      key: "size",
    };
    const result = await firstValueFrom(client.send("product.attribute.delete", payload));
    expect(result.attributes).toEqual({ color: "green" });
    expect(result.version).toBe(5);
  });

  it("should fail to delete non-existent attribute", async () => {
    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 5,
      key: "nonExistentKey",
    };

    await expect(firstValueFrom(client.send("product.attribute.delete", payload))).rejects.toThrow("does not exist");
  });

  it("should fail on version mismatch", async () => {
    const payload = {
      productId: "2face165-5345-4cf3-ab05-5421a6b19df2",
      tenantId: "6ecec59e-81f1-45e6-a9ee-e52eb4e54964",
      version: 999,
      key: "color",
      value: "blue",
    };

    await expect(firstValueFrom(client.send("product.attribute.update", payload))).rejects.toThrow("Version mismatch");
  });
});
