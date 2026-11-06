const express = require("express");
const router = express.Router();
const { run, get, all } = require("../database");

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

function parseNonNegativeNumber(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
  return Number(value);
}

function parseInteger(value, fieldName, defaultValue, minValue) {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minValue) {
    throw new Error(`${fieldName} must be an integer greater than or equal to ${minValue}`);
  }
  return parsed;
}

// GET /books - search, sort, filter and paginate
router.get("/", async (req, res) => {
  try {
    const searchQ = String(req.query.search_q || "").trim();
    const orderBy = String(req.query.order_by || "title").toLowerCase();
    const order = String(req.query.order || "ASC").toUpperCase();
    const limit = parseInteger(req.query.limit, "limit", 10, 1);
    const offset = parseInteger(req.query.offset, "offset", 0, 0);
    const minPrice = parseNonNegativeNumber(req.query.min_price, "min_price");
    const maxPrice = parseNonNegativeNumber(req.query.max_price, "max_price");

    // SQL identifiers cannot be parameterized, so use a strict allow-list.
    const allowedColumns = ["id", "title", "author", "price", "created_at"];
    if (!allowedColumns.includes(orderBy)) {
      return sendError(res, 400, `order_by must be one of: ${allowedColumns.join(", ")}`);
    }
    if (!["ASC", "DESC"].includes(order)) {
      return sendError(res, 400, "order must be ASC or DESC");
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return sendError(res, 400, "min_price cannot be greater than max_price");
    }

    const conditions = [];
    const params = [];

    if (searchQ) {
      conditions.push("title LIKE ?");
      params.push(`%${searchQ}%`);
    }
    if (minPrice !== undefined && maxPrice !== undefined) {
      conditions.push("price BETWEEN ? AND ?");
      params.push(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      conditions.push("price >= ?");
      params.push(minPrice);
    } else if (maxPrice !== undefined) {
      conditions.push("price <= ?");
      params.push(maxPrice);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countRows = await get(
      `SELECT COUNT(*) AS total FROM books ${whereClause}`,
      params
    );
    const books = await all(
      `SELECT id, title, author, price, created_at
       FROM books ${whereClause}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      message: "Books retrieved successfully",
      total: countRows.total,
      limit,
      offset,
      data: books
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
});

// GET /books/:id - retrieve one book
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "id must be a positive integer");
    }
    const book = await get(
      "SELECT id, title, author, price, created_at FROM books WHERE id = ?",
      [id]
    );
    if (!book) return sendError(res, 404, "Book not found");
    return res.status(200).json({ message: "Book retrieved successfully", data: book });
  } catch (error) {
    return sendError(res, 500, "Internal server error");
  }
});

// POST /books - create a book
router.post("/", async (req, res) => {
  try {
    const { title, author, price } = req.body || {};
    if (typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "title is required and must be a non-empty string");
    }
    if (typeof author !== "string" || !author.trim()) {
      return sendError(res, 400, "author is required and must be a non-empty string");
    }
    if (price === undefined || price === null || price === "" ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
      return sendError(res, 400, "price is required and must be a non-negative number");
    }

    const result = await run(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [title.trim(), author.trim(), Number(price)]
    );
    const createdBook = await get(
      "SELECT id, title, author, price, created_at FROM books WHERE id = ?",
      [result.id]
    );
    return res.status(201).json({ message: "Book created successfully", data: createdBook });
  } catch (error) {
    return sendError(res, 500, "Internal server error");
  }
});

// PUT /books/:id - update a book
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "id must be a positive integer");
    }
    const { title, author, price } = req.body || {};
    if (typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "title is required and must be a non-empty string");
    }
    if (typeof author !== "string" || !author.trim()) {
      return sendError(res, 400, "author is required and must be a non-empty string");
    }
    if (price === undefined || price === null || price === "" ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
      return sendError(res, 400, "price is required and must be a non-negative number");
    }

    const existing = await get("SELECT id FROM books WHERE id = ?", [id]);
    if (!existing) return sendError(res, 404, "Book not found");

    await run(
      "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?",
      [title.trim(), author.trim(), Number(price), id]
    );
    const updatedBook = await get(
      "SELECT id, title, author, price, created_at FROM books WHERE id = ?",
      [id]
    );
    return res.status(200).json({ message: "Book updated successfully", data: updatedBook });
  } catch (error) {
    return sendError(res, 500, "Internal server error");
  }
});

// DELETE /books/:id - delete a book
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, "id must be a positive integer");
    }
    const existing = await get("SELECT id FROM books WHERE id = ?", [id]);
    if (!existing) return sendError(res, 404, "Book not found");

    await run("DELETE FROM books WHERE id = ?", [id]);
    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    return sendError(res, 500, "Internal server error");
  }
});

module.exports = router;
