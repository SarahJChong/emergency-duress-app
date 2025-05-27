FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

USER root

# Install curl and jq
RUN apt-get update && \
    apt-get install -y curl jq && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
    
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Debug
WORKDIR /src
COPY ["./api/Api/Api.csproj", "./"]
RUN dotnet restore "./Api.csproj"
COPY api/Api .
WORKDIR "/src/"
RUN dotnet build "Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Debug
RUN dotnet publish "Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN apt-get update && apt-get install -y curl jq
ENTRYPOINT ["/app/docker-entrypoint.sh"]
