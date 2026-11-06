# Lab 3: REST API, Query Parameters, Validation & Debugging

A complete Books REST API built with Node.js, Express.js and SQLite.

- **Name:** Veera Dharan Sri Datta
- **Class:** CSE-FSD-2B
- **Registration Number:** 252U1R7096
- **Faculty Name:** Joel Prasanth

## 🚀 Live Deployment

**Base URL:** `https://bdf-lab-03-rest-api.onrender.com`

| Task | Description | Live API Link |
|---|---|---|
| Task 1 | RESTful Endpoints – List all books (GET) | [GET /books](https://bdf-lab-03-rest-api.onrender.com/books) |
| Task 1 | RESTful Endpoints – Get single book (GET by ID) | [GET /books/1](https://bdf-lab-03-rest-api.onrender.com/books/1) |
| Task 2 | Query Parameters – Search by title | [search_q=fire](https://bdf-lab-03-rest-api.onrender.com/books?search_q=fire) |
| Task 2 | Query Parameters – Sort by price DESC | [order_by=price&order=DESC](https://bdf-lab-03-rest-api.onrender.com/books?order_by=price&order=DESC) |
| Task 2 | Query Parameters – Pagination | [limit=2&offset=0](https://bdf-lab-03-rest-api.onrender.com/books?limit=2&offset=0) |
| Task 3 | Price Range Filter – BETWEEN | [min_price=200&max_price=400](https://bdf-lab-03-rest-api.onrender.com/books?min_price=200&max_price=400) |
| Task 3 | Price Range Filter – min only | [min_price=300](https://bdf-lab-03-rest-api.onrender.com/books?min_price=300) |
| Task 4 | POST Validation – Missing title (400) | POST https://bdf-lab-03-rest-api.onrender.com/books |
| Task 4 | POST Validation – Non-numeric price (400) | POST https://bdf-lab-03-rest-api.onrender.com/books |
| Task 5 | Status Codes – Create book (201) | POST https://bdf-lab-03-rest-api.onrender.com/books |
| Task 5 | Status Codes – Update book (200) | PUT https://bdf-lab-03-rest-api.onrender.com/books/1 |
| Task 5 | Status Codes – Missing ID (404) | [GET /books/999999](https://bdf-lab-03-rest-api.onrender.com/books/999999) |
| Task 6 | Consistent Error Format – Invalid sort | [order=SIDEWAYS](https://bdf-lab-03-rest-api.onrender.com/books?order=SIDEWAYS) |
| Task 7 | Debugging – Server root check | [GET /](https://bdf-lab-03-rest-api.onrender.com/) |


## 1. Requirements

- Node.js 18 or later
- npm
- Postman (for API testing)

## 2. Setup

Open a terminal in this project folder and run:

```bash
npm install
npm start
```

The API runs at `http://localhost:3000`. The SQLite database (`books.db`) is created automatically and sample records are inserted on first run.

To use another port on Windows PowerShell:

```powershell
$env:PORT=3001; npm start
```

On macOS/Linux:

```bash
PORT=3001 npm start
```

## 3. Endpoints

| Method | Endpoint | Purpose | Success status |
|---|---|---|---|
| GET | `/books` | List, search, sort, filter and paginate | 200 |
| GET | `/books/:id` | Get one book | 200 |
| POST | `/books` | Create a book | 201 |
| PUT | `/books/:id` | Update a book | 200 |
| DELETE | `/books/:id` | Delete a book | 200 |

All error responses use the consistent JSON shape:

```json
{ "message": "A clear explanation of the error" }
```

## 4. GET /books query parameters

All parameters are optional and have defaults.

| Parameter | Default | Description |
|---|---|---|
| `search_q` | empty string | Partial title search |
| `order_by` | `title` | Sort column: `id`, `title`, `author`, `price`, `created_at` |
| `order` | `ASC` | Sort direction: `ASC` or `DESC` |
| `limit` | `10` | Maximum number of records |
| `offset` | `0` | Number of records to skip |
| `min_price` | not applied | Minimum price, inclusive |
| `max_price` | not applied | Maximum price, inclusive |

Examples:

```text
GET http://localhost:3000/books
GET http://localhost:3000/books?search_q=fire
GET http://localhost:3000/books?order_by=price&order=DESC
GET http://localhost:3000/books?limit=5&offset=0
GET http://localhost:3000/books?min_price=200&max_price=400
GET http://localhost:3000/books?search_q=the&order_by=title&order=ASC&limit=5&offset=0&min_price=100&max_price=500
```

The search uses SQL `LIKE` with a parameterized value. Sorting columns are checked against an allow-list because SQL identifiers cannot be supplied as query parameters. All user-provided values are parameterized.

## 5. Request body examples

### Create - POST /books

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 550
}
```

### Update - PUT /books/1

```json
{
  "title": "Updated Book Title",
  "author": "Updated Author",
  "price": 399
}
```

The API rejects missing/blank title, missing/blank author, missing price, non-numeric price and negative price with HTTP 400.

## 6. Expected status codes

- `200 OK`: successful GET, update or delete.
- `201 Created`: successful book creation.
- `400 Bad Request`: invalid input or invalid query parameters.
- `404 Not Found`: requested book ID or endpoint does not exist.
- `500 Internal Server Error`: unexpected server/database failure.

## 7. Debugging exercise

1. **EADDRINUSE (port conflict):** Another process is using port 3000. Stop that process or run the app on another port using the `PORT` environment variable. Do not start multiple server instances on the same port.
2. **Wrong import path:** Check the relative path and filename. For example, from `src/routes/books.js`, the database import is `require("../database")`.
3. **No such table:** Ensure the database initialization runs before the server accepts requests. Use the correct table name `books` consistently.
4. **Missing await:** Await asynchronous database operations before using their results or sending the response. This project uses `await` for database calls and awaits initialization before listening.

## Screenshots

### Task 1 — RESTful Endpoint Naming
Use nouns in URLs and HTTP methods to perform actions.

🔗 Live: [GET /books](https://bdf-lab-03-rest-api.onrender.com/books) | [GET /books/1](https://bdf-lab-03-rest-api.onrender.com/books/1)

![alt text](image.png)
![alt text](image-1.png)
![alt text](image-2.png)


### Task 2 — Query Parameters
`search_q`, `order_by`, `order`, `limit`, `offset` with default values.

🔗 Live: [search_q=fire](https://bdf-lab-03-rest-api.onrender.com/books?search_q=fire) | [order_by=price&order=DESC](https://bdf-lab-03-rest-api.onrender.com/books?order_by=price&order=DESC) | [limit=2&offset=0](https://bdf-lab-03-rest-api.onrender.com/books?limit=2&offset=0)

![alt text](image-3.png)
![alt text](image-4.png)
![alt text](image-5.png)

### Task 3 — Price Range Filtering
`min_price` and `max_price` using `BETWEEN` or two conditions.

🔗 Live: [min_price=200&max_price=400](https://bdf-lab-03-rest-api.onrender.com/books?min_price=200&max_price=400) | [min_price=300](https://bdf-lab-03-rest-api.onrender.com/books?min_price=300)

![alt text](image-6.png)
![alt text](image-7.png)


### Task 4 — POST Body Validation
Reject missing title, author or non-numeric price with HTTP 400 and a clear JSON message.

🔗 Live (use Postman): `POST https://bdf-lab-03-rest-api.onrender.com/books`

![alt text](image-8.png)
![alt text](image-9.png)
![alt text](image-10.png)


### Task 5 — HTTP Status Codes
Return 201 after create, 200 after update/delete, 404 when ID does not exist.

🔗 Live: [404 – missing ID](https://bdf-lab-03-rest-api.onrender.com/books/999999) | POST/PUT via Postman

To create (201):
![alt text](image-11.png)

To update and delete (200):
![alt text](image-12.png)

To update/delete missing id (404):
![alt text](image-13.png)


### Task 6 — Consistent Response Format
All errors return `{ "message": "..." }`.

🔗 Live: [Invalid order direction](https://bdf-lab-03-rest-api.onrender.com/books?order=SIDEWAYS) | [Invalid order_by column](https://bdf-lab-03-rest-api.onrender.com/books?order_by=password) | [Unknown endpoint](https://bdf-lab-03-rest-api.onrender.com/unknown)

![alt text](image-14.png)

### Task 7 — Debugging Exercise
Fixed: port conflict (EADDRINUSE), wrong import path, table-name typo, and missing await.

🔗 Live: [Server root check](https://bdf-lab-03-rest-api.onrender.com/)

![alt text](image-15.png)


## 8. Viva answers

**Q1. Query parameter vs path parameter?**  
A path parameter identifies a particular resource, such as `/books/5`. A query parameter modifies or filters a request, such as `/books?search_q=fire`.

**Q2. What does stateless mean?**  
Each HTTP request contains the information needed to process it. The server does not rely on stored session state from a previous request to understand the current request.

**Q3. Which status code for bad input vs a missing record?**  
Use `400 Bad Request` for invalid input and `404 Not Found` when the requested record does not exist.

## 9. Submission contents

- `server.js` - starts the server after database initialization.
- `src/database.js` - SQLite connection and database helper functions.
- `src/routes/books.js` - CRUD routes, query parameters and validation.
- `src/app.js` - Express application and error handling.
- `postman/Lab_03_Books_API.postman_collection.json` - API test collection.
- `postman/POSTMAN_TEST_CHECKLIST.md` - success and failure test checklist.

No `.env` file or `node_modules` folder is included.
