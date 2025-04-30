import "dotenv/config";
import express from "express";
import router from "./routes";

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1); 
  }
}

startServer();
