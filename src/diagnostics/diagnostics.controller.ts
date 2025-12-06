import { Controller, Get, InternalServerErrorException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';

@ApiTags('diagnostics')
@ApiBearerAuth('keycloak')
@Controller('diagnostics')
export class DiagnosticsController {
    private readonly logger = new Logger(DiagnosticsController.name);

    @Get('debug-sentry')
    @ApiOperation({
        summary: 'Trigger a test error to verify Sentry integration',
        description: 'Throws an intentional error that should appear in Sentry',
    })
    async getError(): Promise<never> {
        try {
            throw new Error('My first Sentry error!');
        } catch (err) {
            const eventId = Sentry.captureException(err);
            await Sentry.flush(2000); // force send before responding
            this.logger.error(`Sentry debug event captured`, { eventId });
            throw new InternalServerErrorException({
                message: 'My first Sentry error!',
                eventId,
            });
        }
    }
}
