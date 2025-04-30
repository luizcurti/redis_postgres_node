import { compare } from "bcryptjs";
import { Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { createConnection } from "../postgres";
import { setRedis } from "../redisConfig";

type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  email: string;
};

export class LoginUserController {
  async handle(request: Request, response: Response) {
    const { username, password } = request.body;

    if (!username || !password) {
      return response.status(400).json({ error: "Username and password are required." });
    }

    const clientConnection = await createConnection();

    try {
      const { rows } = await clientConnection.query<User>(
        `SELECT ID, NAME, USERNAME, PASSWORD, EMAIL FROM USERS WHERE USERNAME = $1 LIMIT 1`,
        [username]
      );

      const user = rows[0];

      if (!user) {
        return response.status(401).json({ error: "Invalid credentials." });
      }

      const passwordMatch = await compare(password, user.password);

      if (!passwordMatch) {
        return response.status(401).json({ error: "Invalid credentials." });
      }

      delete user.password;

      const token = sign({}, process.env.JWT_SECRET as string, {
        subject: user.id,
        expiresIn: "1h",
      });

      const userData = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
      };

      await setRedis(`user-${user.id}`, JSON.stringify(userData));

      return response.status(200).json({
        message: "Login successful",
        token,
        user: userData,
      });
    } catch (error) {
      console.error("Login error:", error);
      return response.status(500).json({ error: "Internal server error." });
    } finally {
      await clientConnection.end();
    }
  }
}
