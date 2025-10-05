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

## 🔧 Development Tools

### ESLint & Prettier
This project includes ESLint for code linting and Prettier for code formatting to ensure consistent code quality.

Available scripts:
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run all tests
- `npm run coverage` - Run tests with coverage report

## 🚀 CI/CD Pipeline

This project uses GitHub Actions for continuous integration. The pipeline automatically:

- **Linting**: Runs ESLint to check code quality
- **Formatting**: Validates Prettier code formatting 
- **Type Checking**: Runs TypeScript compiler to check types
- **Testing**: Executes all test suites
- **Coverage**: Generates test coverage reports
- **Build**: Compiles the project to ensure it builds successfully

The CI pipeline runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Node.js versions (20.x)

### Services included in CI:
- PostgreSQL 13 for database tests
- Redis Alpine for caching tests
