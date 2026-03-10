import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterHTTP } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const logLevel = (process.env.OTEL_LOG_LEVEL || '').toLowerCase();

// Enable verbose OpenTelemetry internal logs when requested.
if (logLevel === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'dial-admin',
});

const pinoInstrumentation = new PinoInstrumentation();
const traceExporter = new OTLPTraceExporter();
const logsExporter = new OTLPLogExporter();
const metricReader = getMetricExporter(process.env.OTEL_METRICS_EXPORTER);

const sdk = new NodeSDK({
  resource,
  metricReader,
  spanProcessor: new SimpleSpanProcessor(traceExporter),
  logRecordProcessor: new SimpleLogRecordProcessor(logsExporter),
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (req) => {
        return req.url === '/api/health';
      },
    }),
    new FetchInstrumentation(),
    new UndiciInstrumentation({
      requestHook: (span, request) => {
        span.updateName(`${request.method} ${request.origin}${request.path}`);
      },
    }),
    pinoInstrumentation,
  ],
});

sdk.start();

function getMetricExporter(metricsExporterType: string | undefined) {
  if (!metricsExporterType || metricsExporterType !== 'otlp') {
    const defaultMetricExporter = new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    });
    return defaultMetricExporter;
  }
  const metricExporterHTTP = new OTLPMetricExporterHTTP();
  const metricReaderHTTP = new PeriodicExportingMetricReader({
    exporter: metricExporterHTTP,
  });

  return metricReaderHTTP;
}
