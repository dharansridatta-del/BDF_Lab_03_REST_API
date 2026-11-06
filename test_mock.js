const http = require("http");
const { Socket } = require("net");
const app = require("./src/app");
const { initializeDatabase } = require("./src/database");

function handleRequest(app, { method = "GET", url = "/", headers = {}, body = null }) {
  return new Promise((resolve) => {
    const socket = new Socket();
    const req = new http.IncomingMessage(socket);
    const res = new http.ServerResponse(req);

    req.method = method;
    req.url = url;
    req.headers = headers;

    let responseData = "";
    res.write = function (chunk, encoding) {
      if (chunk) responseData += chunk.toString();
      return true;
    };
    res.end = function (chunk, encoding) {
      if (chunk) responseData += chunk.toString();
      let parsed = responseData;
      try {
        parsed = JSON.parse(responseData);
      } catch {}
      resolve({ status: res.statusCode, headers: res.getHeaders(), body: parsed });
    };

    if (body !== null) {
      req.body = body;
    }

    app(req, res);

    if (body && !req._body) {
      const payload = typeof body === "string" ? body : JSON.stringify(body);
      req.push(payload);
      req.push(null);
    } else {
      req.push(null);
    }
  });
}

async function runTests() {
  await initializeDatabase();
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 0. Root endpoint
  let res = await handleRequest(app, { method: "GET", url: "/" });
  assert(res.status === 200 && res.body.message === "Books REST API is running", "Root GET / returns 200 and message");

  // 1. GET /books
  res = await handleRequest(app, { method: "GET", url: "/books" });
  assert(res.status === 200 && Array.isArray(res.body.data) && res.body.data.length >= 3, "GET /books returns 200 and list");

  // 2. GET /books?search_q=fire
  res = await handleRequest(app, { method: "GET", url: "/books?search_q=fire" });
  assert(res.status === 200 && res.body.data.some(b => b.title.toLowerCase().includes("fire")), "GET /books?search_q=fire finds matching title");

  // 3. GET /books?order_by=price&order=DESC
  res = await handleRequest(app, { method: "GET", url: "/books?order_by=price&order=DESC" });
  const prices = res.body.data.map(b => b.price);
  const sorted = [...prices].sort((a, b) => b - a);
  assert(res.status === 200 && JSON.stringify(prices) === JSON.stringify(sorted), "GET /books?order_by=price&order=DESC sorts descending");

  // 4. GET /books?limit=2&offset=0
  res = await handleRequest(app, { method: "GET", url: "/books?limit=2&offset=0" });
  assert(res.status === 200 && res.body.data.length === 2 && res.body.limit === 2 && res.body.offset === 0, "GET /books?limit=2&offset=0 paginates");

  // 5. GET /books?min_price=200&max_price=400
  res = await handleRequest(app, { method: "GET", url: "/books?min_price=200&max_price=400" });
  const allInRange = res.body.data.every(b => b.price >= 200 && b.price <= 400);
  assert(res.status === 200 && allInRange, "GET /books?min_price=200&max_price=400 filters price range");

  // 6. GET /books/1
  res = await handleRequest(app, { method: "GET", url: "/books/1" });
  assert(res.status === 200 && res.body.data && res.body.data.id === 1, "GET /books/1 returns 200 with book 1");

  // 7. POST /books
  res = await handleRequest(app, {
    method: "POST",
    url: "/books",
    headers: { "content-type": "application/json" },
    body: { title: "Test Driven Development", author: "Kent Beck", price: 350 }
  });
  const createdId = res.body.data ? res.body.data.id : null;
  assert(res.status === 201 && createdId !== null && res.body.data.title === "Test Driven Development", "POST /books creates book and returns 201");

  // 8. PUT /books/:id
  res = await handleRequest(app, {
    method: "PUT",
    url: `/books/${createdId}`,
    headers: { "content-type": "application/json" },
    body: { title: "Test Driven Development (2nd Ed)", author: "Kent Beck", price: 399 }
  });
  assert(res.status === 200 && res.body.data && res.body.data.title === "Test Driven Development (2nd Ed)", "PUT /books/:id updates book and returns 200");

  // 9. DELETE /books/:id
  res = await handleRequest(app, { method: "DELETE", url: `/books/${createdId}` });
  assert(res.status === 200 && res.body.message === "Book deleted successfully", "DELETE /books/:id returns 200");

  // Failure Tests
  // 10. POST without title
  res = await handleRequest(app, {
    method: "POST",
    url: "/books",
    headers: { "content-type": "application/json" },
    body: { author: "No Title Author", price: 100 }
  });
  assert(res.status === 400 && typeof res.body.message === "string", "POST without title returns 400 and JSON message");

  // 11. POST without author
  res = await handleRequest(app, {
    method: "POST",
    url: "/books",
    headers: { "content-type": "application/json" },
    body: { title: "No Author Book", price: 100 }
  });
  assert(res.status === 400 && typeof res.body.message === "string", "POST without author returns 400 and JSON message");

  // 12. POST with non-numeric price
  res = await handleRequest(app, {
    method: "POST",
    url: "/books",
    headers: { "content-type": "application/json" },
    body: { title: "Invalid Price Book", author: "Author", price: "abc" }
  });
  assert(res.status === 400 && typeof res.body.message === "string", "POST with non-numeric price returns 400 and JSON message");

  // 13. POST with negative price
  res = await handleRequest(app, {
    method: "POST",
    url: "/books",
    headers: { "content-type": "application/json" },
    body: { title: "Negative Price Book", author: "Author", price: -10 }
  });
  assert(res.status === 400 && typeof res.body.message === "string", "POST with negative price returns 400 and JSON message");

  // 14. GET /books?order=SIDEWAYS
  res = await handleRequest(app, { method: "GET", url: "/books?order=SIDEWAYS" });
  assert(res.status === 400 && typeof res.body.message === "string", "GET with order=SIDEWAYS returns 400 and JSON message");

  // 15. GET /books?order_by=password
  res = await handleRequest(app, { method: "GET", url: "/books?order_by=password" });
  assert(res.status === 400 && typeof res.body.message === "string", "GET with order_by=password returns 400 and JSON message");

  // 16. GET /books?limit=-1
  res = await handleRequest(app, { method: "GET", url: "/books?limit=-1" });
  assert(res.status === 400 && typeof res.body.message === "string", "GET with limit=-1 returns 400 and JSON message");

  // 17. GET /books/999999
  res = await handleRequest(app, { method: "GET", url: "/books/999999" });
  assert(res.status === 404 && typeof res.body.message === "string", "GET /books/999999 returns 404 and JSON message");

  // 18. PUT /books/999999
  res = await handleRequest(app, {
    method: "PUT",
    url: "/books/999999",
    headers: { "content-type": "application/json" },
    body: { title: "Nonexistent", author: "Nobody", price: 100 }
  });
  assert(res.status === 404 && typeof res.body.message === "string", "PUT /books/999999 returns 404 and JSON message");

  // 19. DELETE /books/999999
  res = await handleRequest(app, { method: "DELETE", url: "/books/999999" });
  assert(res.status === 404 && typeof res.body.message === "string", "DELETE /books/999999 returns 404 and JSON message");

  // 20. GET /unknown
  res = await handleRequest(app, { method: "GET", url: "/unknown" });
  assert(res.status === 404 && typeof res.body.message === "string", "GET /unknown returns 404 and JSON message");

  // 21. Price range min > max
  res = await handleRequest(app, { method: "GET", url: "/books?min_price=500&max_price=200" });
  assert(res.status === 400 && typeof res.body.message === "string", "GET with min_price > max_price returns 400 and JSON message");

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
