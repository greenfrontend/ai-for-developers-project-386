import { fileURLToPath } from 'node:url';

import cors from '@fastify/cors';
import responseValidation from '@fastify/response-validation';
import openapiGlue from '@platformatic/fastify-openapi-glue';
import ajvFormats from 'ajv-formats';
import fastify from 'fastify';

import { createRouteHandlers, toOpenApiServiceHandlers } from './api/handlers.js';
import { errors } from './api/errors.js';
import type { BookingRepository } from './domain.js';
import { createBookingService } from './services/bookingService.js';

export type BuildAppOptions = {
  enableResponseValidation?: boolean;
  now?: () => Date;
  openApiPath?: string;
  repository: BookingRepository;
};

const defaultOpenApiPath = fileURLToPath(new URL('../../contracts/generated/openapi.yaml', import.meta.url));

export async function buildApp(options: BuildAppOptions) {
  const app = fastify({
    ajv: {
      plugins: [ajvFormats],
    },
    logger: false,
  });
  const service = createBookingService({
    now: options.now ?? (() => new Date()),
    repository: options.repository,
  });

  await app.register(cors, {
    origin: true,
  });

  if (options.enableResponseValidation) {
    await app.register(responseValidation, {
      ajv: {
        plugins: [ajvFormats],
      },
    });
  }

  app.setErrorHandler((error, _request, reply) => {
    if (isRequestValidationError(error)) {
      return reply.code(400).send(errors.validation(getErrorMessage(error)));
    }

    if (getErrorCode(error) === 'FST_RESPONSE_VALIDATION_FAILED_VALIDATION') {
      return reply
        .code(500)
        .send({ code: 'RESPONSE_VALIDATION_ERROR', message: 'Response does not match contract.' });
    }

    app.log.error(error);

    return reply.code(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error.',
    });
  });

  await app.register(openapiGlue, {
    serviceHandlers: toOpenApiServiceHandlers(createRouteHandlers(service)),
    specification: options.openApiPath ?? defaultOpenApiPath,
  });

  return app;
}

function isRequestValidationError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { validation?: unknown }).validation);
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const { code } = error as { code?: unknown };

  return typeof code === 'string' ? code : undefined;
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Request validation failed.';
  }

  const { message } = error as { message?: unknown };

  return typeof message === 'string' && message ? message : 'Request validation failed.';
}
