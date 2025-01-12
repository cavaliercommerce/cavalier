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

describe("Product Command (e2e)", () => {
  let app: INestApplication;
  let pgContainer: StartedPostgreSqlContainer;
  let rabbitMQContainer: StartedRabbitMQContainer;
  let prisma: PrismaService;
  let client: ClientProxy;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer("postgres:15").withDatabase("test_db").withUsername("test_user").withPassword("test_pass").start();

    rabbitMQContainer = await new RabbitMQContainer("rabbitmq:latest").withExposedPorts(5672, 15672).start();

    process.env.DATABASE_URL = `postgresql://${pgContainer.getUsername()}:${pgContainer.getPassword()}@${pgContainer.getHost()}:${pgContainer.getPort()}/${pgContainer.getDatabase()}`;
    process.env.RABBITMQ_URL = `amqp://guest:guest@${rabbitMQContainer.getHost()}:${rabbitMQContainer.getMappedPort(5672)}`;

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
        slug: "update-this",
        shortDescription: "Will be updated",
      },
    });

    const updatePayload = {
      id,
      version,
      name: "Updated By Command",
      shortDescription: "Now updated via RMQ",
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
      },
    });

    const deletePayload = {
      id,
      version,
    };

    const deletedProduct = await firstValueFrom(client.send("product.delete", deletePayload));
    const productInDb = await prisma.product.findUnique({
      where: { id },
    });

    expect(deletedProduct).toBeTruthy();
    expect(deletedProduct.id).toBe(id);
    expect(productInDb).toBeNull();
  });
});
