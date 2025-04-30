import { hash } from "bcryptjs";
import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { createConnection } from "../postgres";

export class CreateUserController {
  async handle(request: Request, response: Response) {
    const { username, name, password, email } = request.body;

    if (!username || !name || !password || !email) {
      return response.status(400).json({ error: "Missing required fields." });
    }

    const clientConnection = await createConnection();

    try {
      const { rows } = await clientConnection.query(
        `SELECT 1 FROM USERS WHERE USERNAME = $1 LIMIT 1`,
        [username]
      );

      if (rows.length > 0) {
        return response.status(409).json({ error: "Username already taken." });
      }

      const passwordHash = await hash(password, 8);
      const id = uuid();

      await clientConnection.query(
        `INSERT INTO USERS (ID, NAME, USERNAME, PASSWORD, EMAIL) VALUES ($1, $2, $3, $4, $5)`,
        [id, name, username, passwordHash, email]
      );

      return response.status(201).json({ message: "User created successfully", userId: id });
    } catch (error) {
      console.error("Error creating user:", error);
      return response.status(500).json({ error: "Internal server error" });
    } finally {
      await clientConnection.end();
    }
  }
}
