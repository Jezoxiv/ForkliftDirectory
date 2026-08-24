FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["ForkliftDirectory.csproj", "./"]

RUN dotnet restore "ForkliftDirectory.csproj"

COPY . .

RUN dotnet publish "ForkliftDirectory.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ForkliftDirectory.dll"]
