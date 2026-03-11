import app from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Link Up Us API running at http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
