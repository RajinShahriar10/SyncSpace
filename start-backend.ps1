$env:ConnectionStrings__DefaultConnection = 'Host=ep-bitter-moon-aoefzjzq-pooler.c-2.ap-southeast-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_Fg9dJr0RLPkw;SSL Mode=Require'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Jwt__Key = 'YourSuperSecretDevelopmentKeyHereThatIsAtLeast32CharactersLong!!'
$env:Redis__Connection = ''
$env:GitHub__ClientId = 'Ov23liBN7G6tcfLhKrbl'
$env:GitHub__ClientSecret = 'a8273f56742e9c02fadb07200cb590f4efb0459b'

dotnet run --project backend/src/SyncSpace.API/SyncSpace.API.csproj --urls 'http://localhost:5000'
