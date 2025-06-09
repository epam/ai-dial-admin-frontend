/* eslint-disable no-console */
// eslint-disable-next-line @nx/enforce-module-boundaries
import pkg from '../../../package.json';

import { OTLPLogExporter as OTLPLogExporterHTTP } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterHTTP } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';

import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK, logs } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

function getPrometheusMetricExporter() {
  const defaultMetricExporter = new PrometheusExporter({
    port: Number(process.env.OTEL_EXPORTER_PROMETHEUS_PORT ?? 9464),
    endpoint: '/metrics',
  });
  return defaultMetricExporter;
}

function getOltpMetricExporter() {
  const metricExporterHTTP = new OTLPMetricExporterHTTP();
  const metricReaderHTTP = new PeriodicExportingMetricReader({ exporter: metricExporterHTTP });

  return metricReaderHTTP;
}

//For the opentelemetry debugging uncomment the following line
// For troubleshooting, set the log level to DiagLogLevel.DEBUG
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const httpInstrumentation = new HttpInstrumentation({
  ignoreIncomingRequestHook: (req) => {
    return req.url === '/api/health';
  },
});
const pinoInstrumentation = new PinoInstrumentation();

const metricsExporterType = process.env.OTEL_METRICS_EXPORTER ?? 'otlp';
const metricReader = metricsExporterType === 'otlp' ? getOltpMetricExporter() : getPrometheusMetricExporter();
const defaultTraceExporter = new OTLPTraceExporter({});
const defaultSpanProcessor = new SimpleSpanProcessor(defaultTraceExporter);

const logExporter = new OTLPLogExporterHTTP();
const logRecordProcessor = new logs.BatchLogRecordProcessor(logExporter);

const sdk = new NodeSDK({
  metricReader: metricReader,
  resource: defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || pkg.name || 'dial-admin',
      [ATTR_SERVICE_VERSION]: pkg.version,
    }),
  ),
  instrumentations: [httpInstrumentation, pinoInstrumentation],
  spanProcessors: [defaultSpanProcessor],
  logRecordProcessors: [logRecordProcessor],
});
sdk.start();

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
