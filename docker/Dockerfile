FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/SyncSpace.API/SyncSpace.API.csproj", "src/SyncSpace.API/"]
COPY ["src/SyncSpace.Application/SyncSpace.Application.csproj", "src/SyncSpace.Application/"]
COPY ["src/SyncSpace.Domain/SyncSpace.Domain.csproj", "src/SyncSpace.Domain/"]
COPY ["src/SyncSpace.Infrastructure/SyncSpace.Infrastructure.csproj", "src/SyncSpace.Infrastructure/"]
COPY ["src/SyncSpace.Persistence/SyncSpace.Persistence.csproj", "src/SyncSpace.Persistence/"]
RUN dotnet restore "src/SyncSpace.API/SyncSpace.API.csproj"
COPY . .
WORKDIR "/src/src/SyncSpace.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "SyncSpace.API.dll"]
