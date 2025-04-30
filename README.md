# Node.js, Redis & PostgreSQL Integration

This project demonstrates a simple integration between Node.js, Redis, and PostgreSQL to perform basic operations such as user creation, login authentication, and storing user data in Redis for fast access.

## 🚀 Technologies Used

- Node.js
- Redis - In-memory database for caching
- PostgreSQL - Relational database for persistent storage
- JWT - JSON Web Tokens for user authentication

## 📦 Installation

1. Clone this repository:

```bash
git clone https://github.com/luizcurti/redis-nodis-pg.git
cd redis-nodis-pg
```
2. Install dependencies:
Ensure you have Node.js installed. You can install the dependencies by running:
```bash
npm install
```

3. Setup PostgreSQL & Redis:
Run docker compose
```bash
docker-compose up
```

4. Set up environment variables:
Change the .env environment variables as needed:

```bash
JWT_SECRET=your_jwt_secret_key
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=your_postgres_database_name
```

5. Start the application:
After setting everything up, you can start the application with:
```bash
npm run dev
```
