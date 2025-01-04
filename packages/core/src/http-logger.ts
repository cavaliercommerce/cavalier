import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { IncomingMessage, ServerResponse } from "node:http";
import morgan from "morgan";

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpLoggerMiddleware.name);

  use(req: IncomingMessage, res: ServerResponse<IncomingMessage>, next: () => void) {
    morgan(process.env.NODE_ENV === "production" ? "common" : "dev", {
      stream: {
        write: (message) => this.logger.log(message),
      },
    })(req, res, next);
  }
}
