import { ArgumentMetadata, HttpStatus, PipeTransform, BadRequestException } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { HttpAdapterHost } from "@nestjs/core";

export class ParseJsonPipe implements PipeTransform {
  constructor(private readonly httpAdapterHost?: HttpAdapterHost) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    let parsedValue = value;
    if (typeof parsedValue === "string") {
      try {
        parsedValue = JSON.parse(parsedValue);
      } catch (error) {
        if (!this.httpAdapterHost) {
          throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: "Invalid JSON string", data: error });
        }
        throw new BadRequestException(`Invalid JSON string: ${JSON.stringify(error, null, 2)}`);
      }
    }
    return parsedValue;
  }
}
