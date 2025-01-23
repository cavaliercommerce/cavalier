import { createZodDto } from "nestjs-zod";
import z from "zod";

export const UpdateProductAttributeSchema = z
  .object({
    tenantId: z.string().uuid(),
    productId: z.string().uuid(),
    version: z.number().positive(),
    key: z.string().min(1),
    value: z.any(),
  })
  .strict();

export class UpdateProductAttributeDto extends createZodDto(UpdateProductAttributeSchema) {}
