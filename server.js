const app = require("./src/app");
const { initializeDatabase } = require("./src/database");

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await initializeDatabase();
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the other process or set PORT to another value.`);
      } else {
        console.error("Server error:", error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Could not initialize the database:", error.message);
    process.exit(1);
  }
}

startServer();
