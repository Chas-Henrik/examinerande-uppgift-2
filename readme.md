# Examinationsuppgift - Trullo

## Teoretiska resonemang

### Motivera ditt val av databas

Jag har valt MongoDB med mongoose som ODM då jag förväntar mig en exponentiell tillströmmning av användare 
och pga. detta vill jag ha möjlighet att dela upp databasen på flera servrar i framtiden.
Det är dessutom lite oklart i nuläget vilka fields och scheman jag kommer att behöva i framtiden, och detta är ytterligare ett 
skäl till att jag har valt en NoSQL databas.
Det är även sannolikt att jag kommer att vilja göra komplicerade sökningar/beräkningar med snabba responstider 
i framtiden, och då kommer mongoose aggregation pipelines väl till hands.

### Redogör vad de olika teknikerna (ex. verktyg, npm-paket, etc.) gör i applikationen

- ***@faker-js/faker*** Används för att seeda databasen med fake data.
- ***bcrypt*** Används för att kryptera (hasha) ett lösenord innan det sparas i databasen.
- ***cookie-parser*** Används för att läsa cookies från inkommande HTTP-förfrågningar i en Express-applikation.
- ***cors*** Används i en Express-applikation för att tillåta eller begränsa vilka domäner som får kommunicera med ditt API. Då jag använder Cookie-Token så behöver jag CORS då webbläsare inte tillåter att cookies skickas med cross-origin-förfrågningar utan korrekt CORS-inställning).
- ***dotenv*** Används för att läsa miljövariablerna från .env filen
- ***express*** Är ett webbramverk för Node.js som används för att bygga webbservrar och API:er på ett enkelt och effektivt sätt.
- ***jsonwebtoken*** Används för att signera och verifiera JSON Web Tokens (JWT).
- ***mongoose*** Mongoose är ett ODM (Object Data Modeling) som hjälper mig att arbeta med MongoDB på ett strukturerat och typat sätt genom att definiera scheman och modeller, vilket gör databashantering enklare och säkrare.
- ***zod*** Används för parameter validering i backend.
- ***express-rate-limit*** Används för rate-limiting.
- ***helmet*** Används för att skydda applikationen från vanliga webbsäkerhetshot genom att ställa in olika HTTP-rubriker (headers) på rätt sätt.
- ***compress*** Används för att komprimera HTTP-svar (t.ex. HTML, CSS, JavaScript, JSON) innan de skickas till klienten.
- ***dotenv-expand*** Används för att expandera ${VAR_NAME} värden i .env filen.

### Redogör översiktligt hur applikationen fungerar

Trullo är ett projekt hanteringssystem som för närvarande innehåller tre collections, User, Task & Project.  
  
_Observera_ att jag använder PATCH istället för PUT, då PATCH är mer flexibel & bandbredds effektiv än PUT då man endast behöver inkludera de fält man vill ändra i objektet som man skickar till servern.  
  
_Authentication, authorization, rate limiting, validering & delar av felhanteringen_ utförs i middleware för att kunna återanvända så mycket kod som möjligt och för att göra applikationen mindre felbenägen. Detta är även något som ChatGPT kräver för att godkänna applikationen som 'production ready'.  
  
***Applikationen stöder följande publika endpoints:***
- `POST localhost:3000/api/auth/register` Registrera en ny developer användare (med UserLevel DEVELOPER)
- `POST localhost:3000/api/auth/login` Logga in en användare
- `POST localhost:3000/api/auth/logout` Logga ut en användare
- `GET localhost:3000/api/health` Health Check för uptime checks (användbar för monitorering och last balanserare)  
  
***Applikationen stöder följande endpoints (för autentiserade användare):***
- `POST localhost:3000/api/users` Skapa en ny användare
- `GET localhost:3000/api/users` Hämta alla användare
- `GET localhost:3000/api/users/:id` Hämta en användare
- `PATCH localhost:3000/api/users/:id` Patcha en användare
- `DELETE localhost:3000/api/users/:id` Ta bort en användare
- `GET localhost:3000/api/users/:id/tasks` Hämta alla tasks för en användare  
  <br>  
- `POST localhost:3000/api/tasks` Skapa en ny task
- `GET localhost:3000/api/tasks` Hämta alla task
- `GET localhost:3000/api/tasks/:id` Hämta en task
- `PATCH localhost:3000/api/tasks/:id` Patcha en task
- `DELETE localhost:3000/api/tasks/:id` Ta bort en task  
  <br>  
- `POST localhost:3000/api/projects` Skapa ett nytt projekt
- `GET localhost:3000/api/projects` Hämta alla projekt
- `GET localhost:3000/api/projects/:id` Hämta ett projekt
- `PATCH localhost:3000/api/projects/:id` Patcha ett projekt
- `DELETE localhost:3000/api/projects/:id` Ta bort ett projekt  
- `GET localhost:3000/api/projects/:id/tasks` Hämta alla tasks för ett projekt   
  
***Applikationen stöder följande _VG Features_:***  
1. User, Task & Project collections.
2. Autentisering med JWT (som HTTP-only cookie med 1h expiration time).
3. ADMIN & DEVELOPER User Level.
4. Task stöder fältet `finishedBy` (User ID) och fältet `project` (Project ID).
5. Lösenordet är krypterat i databasen (hash + salt).
6. Registrering av nya developer konton (`POST localhost:3000/api/auth/register`), vem som helst kan registrera ett nytt developer konto (där userLevel sätts till DEVELOPER automatiskt).
7. Endast administratörer kan skapa nya administratörs konton (`POST localhost:3000/api/users`).
8. Användaren kan endast administrera sitt eget användarkonto medan administratörer kan administrera alla användare/uppgifter.
9. Användaren kan endast ta bort sitt eget användarkonto medan administratörer kan ta bort vilka användarkonton som helst utom sitt eget konto (för att garantera att det alltid finns minst ett administratörs konto i systemet).
10. Authentiserade användare har full access till alla tasks.
11. Endast ägaren eller en administratör kan ändra eller ta bort ett projekt, och ägaren (projeketets `owner` fält) sätts automatiskt till den inloggade användaren när projektet skapas.
12. Rate Limiter på känsliga routes, som t.ex. `localhost:3000/api/auth/login` och en generell Rate Limiter på övriga routes för att bibehålla stabilitet, säkerhet och tillgänglighet.
13. Dummy bcrypt-hash vid login för att mildra timingattacker.
14. Authentication middleware (authenticate.ts).
14. Authorization middleware (authorizeProject.ts & authorizeUser.ts).
15. Helmet skyddar applikationen från vanliga webbsäkerhetshot genom att ställa in olika HTTP-rubriker (headers) på rätt sätt.
16. Compress komprimerar HTTP-svar (t.ex. HTML, CSS, JavaScript, JSON) innan de skickas till klienten.
17. HTTPS för produktions versionen.
18. Health Check for uptime checks.
19. Stöder pagination för GET `/api/users`, `/api/tasks`, `/api/projects`.

### Körguide  
  
1. ***MONGODB_URI*** Hämta din egen MongoDB connection string från Atlas och lägg till `/trulloDatabase` som databas namn (se `env_example`).
2. ***JWT_SECRET*** Generera en JWT_SECRET (se `.env_example`) via att köra följande kommando i terminalen: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
3. ***NODE_ENV*** Välj vilken version du ska bygga (`development` eller `production`), se `env_example` för mer info.
4. ***PORT*** Välj TCP port (3000 för `development` versionen och 3443 för `production` versionen)
5. ***FRONTEND_URL*** Konfigurera frontend URL:en till `http://localhost:${PORT}`.
6. ***SSL_CERT_PATH*** Konfigurera pathen till ditt SSL certifikat om du bygger produktions versionen (default är `./certs/cert.pem`).
7. ***SSL_KEY_PATH***  Konfigurera pathen till din SSL nyckel om du bygger produktions versionen (default är `./certs/key.pem`).
8. ***Seed Kommando*** `npm run seed`
9. ***Start Kommando*** `npm run dev`
10. ***Inloggningsuppgifter för admin*** E-mail: `admin@example.com`, Password: `topsecret`
11. ***Inloggningsuppgifter för seeded users*** E-mail: `user@example.com`, Password: `topsecret`
12. ***Thunder Client*** Använd Thunder Client (eller Postman) för att skicka requests till endpointsen.
13. ***Inloggning*** Börja med att logga in (då endast 4 endpoints är publika).
14. ***Test*** Kör sedan valfria tester efter att du har loggat in (välj från endpointsen nedan).  

### Rate Limiting & SSL certificat
  
***Rate Limiting***  
Känsliga routes (`POST` `/api/auth/register`, `/api/auth/login` & `/api/users`) har en rate limit på _20 requests / 10 min_ för att bla. förhindra 'brute force inloggnings attacker'.  
Övriga routes har en rate limit på _100 requests / 10 min_ för att bibehålla stabilitet, säkerhet och tillgänglighet.  
  
***SSL Certificat***  
Om du konfigurerar `.env` filen för produktions versionen (`NODE_ENV=production`) så ska du använda `PORT` 3443, och du kan skapa ditt egna lokala SSL certificat med:  
```bash
mkdir certs
openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem
```  
_Glöm inte att prefixa med `https://localhost:3443/` i Thunder Client när du kör produktions versionen!!!_
  
  
### Publika Endpoints (`NODE_ENV=development`)  

#### Registrera en ny användare (DEVELOPER)  
_Endpoint:_  
```
POST localhost:3000/api/auth/register
```  
_Body (JSON):_
```json
{ 
  "name": "Lena Andersson",
  "email": "lena.andersson@gmail.com", 
  "password": "topsecret"
}
```

#### Logga in en användare  
_Endpoint:_  
```
POST localhost:3000/api/auth/login
```  
_Body (JSON):_
```json
{ 
  "email": "lena.andersson@gmail.com", 
  "password": "topsecret"
}
```

#### Logga ut en användare  
_Endpoint:_  
```
POST localhost:3000/api/auth/logout
```  
<br>  

### 'users' Endpoints (`NODE_ENV=development`)  

#### Skapa en ny användare  
_Endpoint:_  
```
POST localhost:3000/api/users
```  
_Body (JSON):_
```json
{ 
  "name": "Bertil Bertilsson",
  "email": "bertil.bertilsson@company.com", 
  "password": "topsecret",
  "userLevel": "ADMIN"
}
```
_*Endast tillgänglig för ADMIN-användare_  

#### Hämta alla användare  
_Endpoint:_  
```
GET localhost:3000/api/users
```  
_*Endast tillgänglig för ADMIN-användare_  

#### Hämta alla användare (med pagination)
_Endpoint:_  
```
GET localhost:3000/api/users?page=1&size=3
```  
_*Endast tillgänglig för ADMIN-användare_  

#### Hämta en användare  
_Endpoint:_  
```
GET localhost:3000/api/users/68ce5784e2da8623257e2736
```  
_*Endast tillgänglig för ADMIN-användare och användaren med user ID't ovan_  

#### Patcha en användare  
_Endpoint:_  
```
PATCH localhost:3000/api/users/68ce5784e2da8623257e2736
```  
_Body Example 1 (JSON):_
```json
{ 
  "name": "Lisa Andersson",
  "email": "lisa.andersson@gmail.com"
}
```
_Body Example 2 (JSON):_
```json
{ 
  "password": "mysecretpsw"
}
```
_*Endast tillgänglig för ADMIN-användare och användaren med user ID't ovan_  

#### Ta bort en användare  
_Endpoint:_  
```
DELETE localhost:3000/api/users/68ce5810e2da8623257e273a
```  
_*Endast tillgänglig för ADMIN-användare och användaren med user ID't ovan_  

#### Hämta alla tasks för en användare  
_Endpoint:_  
```
GET localhost:3000/api/users/68ce5784e2da8623257e2736/tasks
```  
_*Endast tillgänglig för ADMIN-användare och användaren med user ID't ovan_  

### 'tasks' Endpoints (`NODE_ENV=development`)  

#### Skapa en ny task 
_Endpoint:_  
```
POST localhost:3000/api/tasks
```  
_Body (JSON):_
```json
{ 
  "title": "Trullo subtask 1",
  "description": "Implement task endpoints",
  "status": "to-do",
  "assignedTo": "68ce78e4af8e379dbf9b1e83",
  "project": "68ce78e4af8e379dbf9b1e89"
}
```

#### Hämta alla tasks
_Endpoint:_  
```
GET localhost:3000/api/tasks
```  

#### Hämta alla tasks (med pagination)
_Endpoint:_  
```
GET localhost:3000/api/tasks?page=1&size=10
```  

#### Hämta en task
_Endpoint:_  
```
GET localhost:3000/api/tasks/68ce78e4af8e379dbf9b1e8d
```  

#### Patcha en task
_Endpoint:_  
```
PATCH localhost:3000/api/tasks/68ce78e4af8e379dbf9b1e8d
```  
_Body Example 1 (JSON):_
```json
{ 
  "title": "Trullo Subtask 1",
  "description": "Implement task models & endpoints",
  "status": "in progress",
  "assignedTo": "68ce78e4af8e379dbf9b1e84",
  "project": "68ce78e4af8e379dbf9b1e88"
}
```
_Body Example 2 (JSON):_
```json
{ 
  "status": "done"
}
```  

#### Ta bort en task
_Endpoint:_  
```
DELETE localhost:3000/api/tasks/68ce78e4af8e379dbf9b1e8d
``` 


### 'projects' Endpoints (`NODE_ENV=development`)  

#### Skapa ett nytt projekt
_Endpoint:_  
```
POST localhost:3000/api/projects
```  
_Body (JSON):_
```json
{
  "name": "Trullo",
  "description": "Trullo project description"
}
```

#### Hämta alla projekt
_Endpoint:_  
```
GET localhost:3000/api/projects
```  

#### Hämta alla projekt (med pagination)
_Endpoint:_  
```
GET localhost:3000/api/projects?page=1&size=2
```  

#### Hämta ett projekt
_Endpoint:_  
```
GET localhost:3000/api/projects/68ce9e5f2dde32359e5d814b
```  

#### Patcha ett projekt
_Endpoint:_  
```
PATCH localhost:3000/api/projects/68ce9e5f2dde32359e5d814b
```  
_Body (JSON):_
```json
{
  "name": "Trello Project",
  "description": "Trello project description",
  "owner": "68ce78e4af8e379dbf9b1e83"
}
```
_*Endast tillgänglig för projektägaren och ADMIN-användare_  

#### Ta bort ett projekt
_Endpoint:_  
```
DELETE localhost:3000/api/projects/68ce9e5f2dde32359e5d814b
```  
_*Endast tillgänglig för projektägaren och ADMIN-användare_  

#### Hämta alla tasks för ett projekt
_Endpoint:_  
```
GET localhost:3000/api/projects/68ce78e4af8e379dbf9b1e88/tasks
```  
  
