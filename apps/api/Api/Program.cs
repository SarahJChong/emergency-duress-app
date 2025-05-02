using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Api.Models;
using Api.Services;
using Api.Services.Notifications;
using Api.Services.Notifications.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;

// Configure OpenTelemetry
const string serviceName = "BackendAPI";

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddOpenTelemetry(options =>
{
    options
        .SetResourceBuilder(
            ResourceBuilder.CreateDefault()
                .AddService(serviceName))
        .AddConsoleExporter();
});
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(serviceName))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddConsoleExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddConsoleExporter());

// Configure MongoDB settings
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB"));

// Register MongoDB client and database
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddSingleton(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    return client.GetDatabase(settings.DatabaseName);
});

builder.Services.AddScoped<IRepository<Location>>(sp =>
{
    var database = sp.GetRequiredService<IMongoDatabase>();
    return new MongoRepository<Location>(database, "locations");
});

builder.Services.AddScoped<IRepository<User>>(sp =>
{
    var database = sp.GetRequiredService<IMongoDatabase>();
    return new MongoRepository<User>(database, "users");
});

builder.Services.AddScoped<IRepository<Incident>>(sp =>
{
    var database = sp.GetRequiredService<IMongoDatabase>();
    return new MongoRepository<Incident>(database, "incidents");
});

builder.Services.AddScoped<IRepository<ErrorLog>>(sp =>
{
    var database = sp.GetRequiredService<IMongoDatabase>();
    return new MongoRepository<ErrorLog>(database, "errorlogs");
});

// Configure email notification settings
builder.Services.Configure<EmailNotificationSettings>(
    builder.Configuration.GetSection("Notifications:Email"));
builder.Services.Configure<SendGridSettings>(
    builder.Configuration.GetSection("Notifications:SendGrid"));
builder.Services.Configure<ExpoPushSettings>(
    builder.Configuration.GetSection("Notifications:Expo"));
builder.Services.Configure<WebPushNotificationSettings>(
    builder.Configuration.GetSection("Notifications:WebPush"));

// Register notification services
builder.Services.AddScoped<IEmailNotificationService, SendGridEmailNotificationService>();

// Register both push notification services as a collection
builder.Services.AddHttpClient<ExpoPushNotificationService>((serviceProvider, client) =>
{
    var settings = serviceProvider.GetRequiredService<IOptions<ExpoPushSettings>>().Value;
    client.BaseAddress = new Uri(settings.ApiUrl);
    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
});

builder.Services.AddScoped<ExpoPushNotificationService>();
builder.Services.AddScoped<WebPushNotificationService>();

// Register both implementations as IPushNotificationService
builder.Services.AddScoped<IEnumerable<IPushNotificationService>>(sp => new IPushNotificationService[]
{
    sp.GetRequiredService<ExpoPushNotificationService>(),
    sp.GetRequiredService<WebPushNotificationService>()
});

builder.Services.AddScoped<INotificationService, NotificationService>();


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.Authority = builder.Configuration["Authentication:Authority"];
    options.Audience = builder.Configuration["Authentication:Audience"];
    options.IncludeErrorDetails = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        RoleClaimType = builder.Configuration["Authentication:RoleClaimType"]
    };
});
builder.Services.AddAuthorization();

// Add services to the container.

builder.Services.Configure<CorsSettings>(
    builder.Configuration.GetSection("Cors"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        corsPolicyBuilder =>
        {
            var corsSettings = builder.Configuration.GetSection("Cors").Get<CorsSettings>();
            corsPolicyBuilder
                .WithOrigins(corsSettings?.AllowedOrigin ?? "http://localhost:8081")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public class MongoDbSettings
{
    public string ConnectionString { get; set; }
    public string DatabaseName { get; set; }
}

public class CorsSettings
{
    public string AllowedOrigin { get; set; }
}