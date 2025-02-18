import { createZodDto } from "nestjs-zod";
import z from "zod";

export const CreateProductAttributeSchema = z
  .object({
    tenantId: z.string().uuid(),
    productId: z.string().uuid(),
    version: z.number().positive(),
    key: z.string().min(1),
    value: z.any().refine((value) => value !== null && value !== undefined, { message: "Value cannot be null or undefined" }),
  })
  .strict();

export class CreateProductAttributeDto extends createZodDto(CreateProductAttributeSchema) {}
