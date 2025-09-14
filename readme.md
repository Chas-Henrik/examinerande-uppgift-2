# Examinationsuppgift - Trullo

## Teoretiska resonemang

### Motivera ditt val av databas

Jag har valt MongoDB med mongoose som ODM då jag förväntar mig en exponentiell tillströmmning av användare 
och då vill jag ha möjlighet att dela upp databasen på flera servrar.
Det är dessutom lite oklart i nuläget vilka fields och scheman jag kommer att behöva i framtiden, och detta är ytterligare ett 
skäl till att jag har valt MongoDB.
Och det är även troligt att jag kommer att vilja göra komplicerade sökningar/beräkningar med snabba responstider 
i framtiden, och då kommer mongoose aggregation pipelines väl till hands.

### Redogör vad de olika teknikerna (ex. verktyg, npm-paket, etc.) gör i applikationen

- ***@faker-js/faker*** Används för att seeda databasen med fake data.
- ***bcrypt*** Används för att kryptera (hasha) ett lösenord innan det sparas i databasen.
- ***cookie-parser*** Används för att läsa cookies från inkommande HTTP-förfrågningar i en Express-applikation.
- ***cors*** Används i en Express-applikation för att tillåta eller begränsa vilka domäner som får kommunicera med ditt API. Då jag använder Cookie-Token så behöver jag CORS då webbläsare inte tillåter att cookies skickas med cross-origin-förfrågningar utan korrekt CORS-inställning).
- ***dotenv*** Används för att läsa miljövariablerna från .env filen
- ***express*** Är ett webbramverk för Node.js som används för att bygga webbservrar och API:er på ett enkelt och effektivt sätt.
- ***jsonwebtoken*** Används för att signera och verifiera JSON Web Tokens (JWT).
- ***lodash*** Används vid PATCH för att 'deep merga' det existerande objektet i databasen med det patchade objektet. 
- ***mongoose*** Mongoose är ett ODM (Object Data Modeling) som hjälper mig att arbeta med MongoDB på ett strukturerat och typat sätt genom att definiera scheman och modeller, vilket gör databashantering enklare och säkrare.
- ***zod*** Används för parameter validering i backend.

### Redogör översiktligt hur applikationen fungerar

***Applikationen stöder följande endpoints:***
- `POST localhost:3000/api/auth/register` Registrera en ny developer användare (med UserLevel DEVELOPER)
- `POST localhost:3000/api/auth/login` Logga in en användare
- `POST localhost:3000/api/auth/logout` Logga ut en användare

***Applikationen stöder följande endpoints (för autentiserade användare):***
- `POST localhost:3000/api/users` Skapa en ny användare
- `GET localhost:3000/api/users` Hämta alla användare
- `GET localhost:3000/api/users/:id` Hämta en användare
- `PATCH localhost:3000/api/users/:id` Patcha en användare
- `DELETE localhost:3000/api/users/:id` Ta bort en användare

- `POST localhost:3000/api/tasks` Skapa en ny task
- `GET localhost:3000/api/tasks` Hämta alla task
- `GET localhost:3000/api/tasks/:id` Hämta en task
- `PATCH localhost:3000/api/tasks/:id` Patcha en task
- `DELETE localhost:3000/api/tasks/:id` Ta bort en task

***Applikationen stöder följande features:***
1. User & Task collections
2. Autentisering med JWT (som HTTP-only cookie)
3. ADMIN & DEVELOPER User Level
4. Stöder fältet `finishedBy`
5. Lösenordet är krypterat i databasen (hash + salt)
6. Användaren kan ändra sitt eget lösenord medan administratören kan ändra lösenord för vilken användare som helst
7. Endast autentiserade användare kan ändra sina egna uppgifter medan administratören kan ändra uppgifter för vilken användare som helst

### Körguide 
***.env fil exempel***
```bash
MONGODB_URI=mongodb+srv://henriksuurik:Dq7JXt3eQbtxZJM0@cluster0.r6jzab0.mongodb.net/trulloDatabase?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=I5YhOGe8MW2xsVbrH+QvH3LGYZsi3Cx1qEbP3yD2ZmKRCn4bWb8D6Pyi/7TFEL17
```

1. ***MONGODB_URI*** Hämta din egen MongoDB connection string från Atlas och lägg till `/trulloDatabase` som databas namn (se .env fil exempel ovan).
2. ***JWT_SECRET*** Generera en JWT_SECRET via att köra följande kommando i terminalen: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
3. ***Seed Command*** `npm run seed`
4. ***Start Command*** `npm run dev`
5. ***Admin Account*** E-mail: `admin@example.com`, Password: `topsecret`

## Mål

Målet är att skapa ett REST-API för en projekthanterings-applikation vid namn Trullo. API\:et ska möjliggöra att användare (User) kan skapa uppgifter (Task) och planera projekt. Databasen ska vara antingen SQL eller NoSQL.

### Teoretiska resonemang

- Motivera ditt val av databas
- Redogör vad de olika teknikerna (ex. verktyg, npm-paket, etc.) gör i applikationen
- Redogör översiktligt hur applikationen fungerar

### Krav för Godkänt

- REST-API\:et använder **Node.js, Express och TypeScript**
- **SQL- eller NoSQL-databas**
  - Om SQL → använd t.ex. Prisma med migrationer. Om NoSQL (MongoDB & Mongoose) → definiera relevanta scheman och modeller.
- Datamodellen har objektet `Task` med följande fält

  - `id`
  - `title`
  - `description`
  - `status` (tillåtna värden: `"to-do"`, `"in progress"`, `"blocked"`, `"done"`)
  - `assignedTo` (**referens till `User.id`, kan vara `null`**)
    Om värdet inte är `null` måste användaren finnas (validera i endpointen innan skrivning).
  - `createdAt` (**sätts automatiskt på serversidan**)
  - `finishedAt` (**sätts automatiskt när `status` uppdateras till `"done"`; annars `null`**)

- Datamodellen har objektet `User` med följande fält

  - `id`
  - `name`
  - `email` (**unik, giltigt format**)
  - `password` (**minst 8 tecken**, lagras **inte** i klartext, använd bcrypt ex.)

- Möjlighet att **skapa, läsa, uppdatera och ta bort** en `User`
- Möjlighet att **skapa, läsa, uppdatera och ta bort** en `Task`
- En `User` kan **tilldelas** en `Task` via fältet `assignedTo`
- **Grundläggande validering och felhantering**
  Vid ogiltig indata → `400`, resurs saknas → `404`, unikhetskonflikt (t.ex. e-post) → `409`, internt fel → `500`.

### Vidareutveckling för Väl Godkänt

Följande urval är exempel på vidareutveckling. Egna förslag välkomnas.

- Applikationen är **robust** med genomtänkt **felhantering och validering** (viktigast för VG)
- Utveckla datamodellen med fler fält och objekt
  – t.ex. `tags` på `Task`, `Project` (Trello-liknande board) där `Task` tillhör ett projekt
- **Authentication & Authorization**

  - Implementera autentisering med **JWT**
  - Endast autentiserade användare kan ändra sina uppgifter
  - **Rollhantering** (t.ex. `role: "admin"`) som kan administrera alla användare/uppgifter
  - **Färdigställare / audit (`finishedBy`)**
    - Lägg till fältet `finishedBy: User.id | null` på `Task` (**VG**).
    - Sätts **automatiskt på serversidan** när en task byter status från något annat till `"done"`; klienten ska **inte** skicka detta fält.
    - Använd den inloggade användaren från JWT (t.ex. `req.user.id`).

- **Kryptera lösenord** i databasen (hash + salt)
- Implementera möjlighet för användaren att **nollställa och välja nytt lösenord**

### Inlämning

- Lägg en textfil med svaren från **Teoretiska resonemang** i roten av repo (t.ex. `README.md`)
- Lämna in länk till git-repo (t.ex. GitHub) i Canvas
- Inlämning senast **måndagen den 29\:e september kl. 23:59**
- Bifoga en kort **körguide** i `README.md` (hur man startar, env-variabler). En enkel `env.example` uppskattas.

**Seed-data:**
Repo får gärna också innehålla:

- En scriptad seed (t.ex. `npm run seed`) som skapar **minst 2 users** (varav 1 admin om du gör VG-auth) och **minst 4 tasks** med blandade statusar.
- Lösenord i seed ska **hashas** (inte i klartext i DB).
- `assignedTo` i seed ska peka på befintlig user (eller vara `null`).
- (Om auth) dokumentera testkonto i `README.md` (t.ex. `admin@example.com` / `Passw0rd!`).
- Beskriv hur man kör seed i `README.md`.
