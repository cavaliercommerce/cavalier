import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateProductVariantSchema = z
  .object({
    productId: z.string().uuid(),
    tenantId: z.string().uuid(),
    version: z.number().positive(),
    name: z.string().min(1),
    sku: z.string().optional(),
    prices: z.array(z.object({ currency: z.string(), amount: z.number().positive() })).optional(),
  })
  .strict();

export class CreateProductVariantDto extends createZodDto(CreateProductVariantSchema) {}
