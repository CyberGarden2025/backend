import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    type NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, originalUrl, body } = request;
        const startedAt = Date.now();

        return next.handle().pipe(
            tap(() => {
                const duration = Date.now() - startedAt;
                const statusCode = response.statusCode;
                this.logger.log(
                    `${method} ${originalUrl} ${statusCode} ${duration}ms body=${JSON.stringify(body)}`,
                );
            }),
        );
    }
}
