// eslint-disable-next-line @nx/enforce-module-boundaries
import pkg from '../../../package.json';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || pkg.name || 'dial-admin',
  }),
  spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
  instrumentations: [
    new HttpInstrumentation(),
    new FetchInstrumentation(),
    new UndiciInstrumentation({
      requestHook: (span, request) => {
        span.updateName(`${request.method} ${request.origin}${request.path}`);
      },
    }),
  ],
});

sdk.start();
