import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";

export class ParseJsonPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    let parsedValue = value;
    if (typeof parsedValue === "string") {
      try {
        parsedValue = JSON.parse(parsedValue);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new BadRequestException(`Invalid JSON string: ${error.message}`);
        }
        throw error;
      }
    }
    return parsedValue;
  }
}
