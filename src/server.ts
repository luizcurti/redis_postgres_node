import 'dotenv/config';
import express from 'express';
import router from './routes';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

app.use(router);

const PORT = process.env.NODE_ENV === 'test' ? 0 : process.env.PORT || 3000;

export async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'test') {
        const address = server.address();
        const port = typeof address === 'string' ? address : address?.port;
        console.log(`Server is running on PORT ${port}`);
      }
    });
    return server;
  } catch (err) {
    throw err;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
