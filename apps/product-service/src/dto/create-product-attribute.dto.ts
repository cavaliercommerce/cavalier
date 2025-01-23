import { createZodDto } from "nestjs-zod";
import z from "zod";

export const CreateProductAttributeSchema = z
  .object({
    tenantId: z.string().uuid(),
    productId: z.string().uuid(),
    version: z.number().positive(),
    key: z.string().min(1),
    value: z.any(),
  })
  .strict();

export class CreateProductAttributeDto extends createZodDto(CreateProductAttributeSchema) {}
