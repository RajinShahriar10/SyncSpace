FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/src/SyncSpace.Domain/SyncSpace.Domain.csproj backend/src/SyncSpace.Domain/
COPY backend/src/SyncSpace.Application/SyncSpace.Application.csproj backend/src/SyncSpace.Application/
COPY backend/src/SyncSpace.Persistence/SyncSpace.Persistence.csproj backend/src/SyncSpace.Persistence/
COPY backend/src/SyncSpace.Infrastructure/SyncSpace.Infrastructure.csproj backend/src/SyncSpace.Infrastructure/
COPY backend/src/SyncSpace.API/SyncSpace.API.csproj backend/src/SyncSpace.API/

RUN dotnet restore backend/src/SyncSpace.API/SyncSpace.API.csproj

COPY backend/src/ backend/src/

RUN dotnet publish backend/src/SyncSpace.API/SyncSpace.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

ENTRYPOINT ["dotnet", "SyncSpace.API.dll"]
