$env:ConnectionStrings__DefaultConnection = 'Host=ep-bitter-moon-aoefzjzq-pooler.c-2.ap-southeast-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_Fg9dJr0RLPkw;SSL Mode=Require'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Jwt__Key = 'YourSuperSecretDevelopmentKeyHereThatIsAtLeast32CharactersLong!!'
$env:Redis__Connection = ''

dotnet run --project backend/src/SyncSpace.API/SyncSpace.API.csproj --urls 'http://localhost:5000'
