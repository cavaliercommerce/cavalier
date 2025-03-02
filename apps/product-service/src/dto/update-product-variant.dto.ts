import { createZodDto } from "nestjs-zod";
import z from "zod";

export const UpdateProductVariantSchema = z
  .object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    version: z.number().positive(),
    productId: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    sku: z.string().optional(),
    prices: z.array(z.object({ currency: z.string(), amount: z.number().positive() })).optional(),
  })
  .strict();

export class UpdateProductVariantDto extends createZodDto(UpdateProductVariantSchema) {}
