const express = require("express");
const booksRouter = require("./routes/books");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Books REST API is running",
    endpoints: {
      listAndSearch: "GET /books",
      getOne: "GET /books/:id",
      create: "POST /books",
      update: "PUT /books/:id",
      delete: "DELETE /books/:id"
    }
  });
});

app.use("/books", booksRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }
  return res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
