import { BadRequestException, HttpStatus } from "@nestjs/common";
import { createZodValidationPipe } from "nestjs-zod";
import { RpcException } from "@nestjs/microservices";
import { ZodError } from "zod";

export const RpcZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    const formattedError = formatZodError(error);
    return new RpcException({ status: HttpStatus.BAD_REQUEST, message: "Validation failed", data: formattedError });
  },
});

export const HttpZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    const formattedError = formatZodError(error);
    return new BadRequestException(formattedError);
  },
});

interface ValidationErrorResponse {
  type: "validation";
  invalidFields: Array<{
    field: string;
    errorCode: string;
    details?: string;
  }>;
}

export const formatZodError = (error: ZodError): ValidationErrorResponse => {
  const invalidFields = error.errors.map((err) => {
    const field = err.path.join(".");

    return {
      field,
      errorCode: err.code,
      details: err.message,
    };
  });

  console.debug("Validation failed with error", error);

  return {
    type: "validation",
    invalidFields,
  };
};
