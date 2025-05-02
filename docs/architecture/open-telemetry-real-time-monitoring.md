# Using OpenTelemetry for Real-Time Monitoring

## Overview

OpenTelemetry is a powerful open-source observability framework that enables real-time monitoring of applications. It provides tools to collect, process, and export telemetry data such as traces, metrics, and logs to various backends for analysis.
This document outlines how to use OpenTelemetry for real-time monitoring in the backend API, based on the latest implementation in `apps/api/Api/Program.cs`.
This documentation provides a comprehensive guide to using OpenTelemetry for real-time monitoring in the backend API. It includes examples for Azure, AWS, and GCP integrations, ensuring flexibility for various deployment environments.

---

## Key Features

- **Traces**: Track the flow of requests across services.
- **Metrics**: Monitor performance indicators like response times and error rates.
- **Logs**: Capture detailed information about application events.

---

## Setup Instructions

### 1. Install OpenTelemetry SDK

Ensure the OpenTelemetry SDK is installed in your project. For .NET applications, add the following NuGet packages:

- `OpenTelemetry`
- `OpenTelemetry.Extensions.Hosting`
- `OpenTelemetry.Exporter.Console` (or any other exporter of your choice)

Example:

```bash
dotnet add package OpenTelemetry --version 1.5.0
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Exporter.Console
```

---

### 2. Configure OpenTelemetry in the Backend API

The following configuration is based on the latest implementation in `apps/api/Api/Program.cs`:

```csharp
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

const string serviceName = "BackendAPI";

var builder = WebApplication.CreateBuilder(args);

// Configure OpenTelemetry Logging
builder.Logging.AddOpenTelemetry(options =>
{
    options
        .SetResourceBuilder(
            ResourceBuilder.CreateDefault()
                .AddService(serviceName))
        .AddConsoleExporter();
});

// Configure OpenTelemetry Tracing and Metrics
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(serviceName))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddConsoleExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddConsoleExporter());
```

---

### 3. Exporters

OpenTelemetry supports multiple exporters to send telemetry data to various backends. Examples include:

- **Console Exporter**: Outputs telemetry data to the console.
- **Prometheus Exporter**: Exposes metrics in a format compatible with Prometheus.
- **Jaeger Exporter**: Sends traces to a Jaeger backend.

Configure the exporter in `Program.cs`:

```csharp
.AddConsoleExporter(); // Replace with .AddJaegerExporter() or .AddPrometheusExporter()
```

---

### 4. Cloud-Specific Examples

#### Azure

1. Use the **Azure Monitor Exporter**:
   ```bash
   dotnet add package OpenTelemetry.Exporter.AzureMonitor
   ```
2. Update `Program.cs`:
   ```csharp
   .AddAzureMonitorExporter(options =>
   {
       options.ConnectionString = "<Azure Monitor Connection String>";
   });
   ```

#### AWS

1. Use the **AWS X-Ray Exporter**:
   ```bash
   dotnet add package OpenTelemetry.Exporter.AWSXRay
   ```
2. Update `Program.cs`:
   ```csharp
   .AddAWSXRayExporter(options =>
   {
       options.Endpoint = "<AWS X-Ray Endpoint>";
   });
   ```

#### GCP

1. Use the **Google Cloud Trace Exporter**:
   ```bash
   dotnet add package OpenTelemetry.Exporter.GoogleCloudTrace
   ```
2. Update `Program.cs`:
   ```csharp
   .AddGoogleCloudTraceExporter(options =>
   {
       options.ProjectId = "<GCP Project ID>";
   });
   ```

---

### 5. Testing and Validation

- Use tools like `curl` or Postman to send requests to your API and verify that telemetry data is being captured.
- Check the configured exporter (e.g., console output or cloud provider) to ensure data is exported correctly.

---

## Best Practices

1. **Environment-Specific Configuration**: Use environment variables to configure exporters and sampling rates for different environments (development, staging, production).
2. **Sampling**: Adjust sampling rates to balance performance and data granularity.
3. **Error Handling**: Ensure exceptions are properly logged and traced.

---

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/)
- [OpenTelemetry .NET SDK](https://github.com/open-telemetry/opentelemetry-dotnet)
- [Azure Monitor Exporter](https://learn.microsoft.com/en-us/azure/azure-monitor/)
- [AWS X-Ray Exporter](https://aws.amazon.com/xray/)
- [Google Cloud Trace Exporter](https://cloud.google.com/trace)

---
