import { createZodDto } from "nestjs-zod";
import z from "zod";

const CreateProductVariantSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
});

export class CreateProductVariantDto extends createZodDto(CreateProductVariantSchema) {}
