# Postman Test Checklist

Set `baseUrl` to `http://localhost:3000`.

## Success tests

1. `GET {{baseUrl}}/books` -> 200; list returned.
2. `GET {{baseUrl}}/books?search_q=fire` -> 200; partial title search.
3. `GET {{baseUrl}}/books?order_by=price&order=DESC` -> 200; descending price order.
4. `GET {{baseUrl}}/books?limit=2&offset=0` -> 200; at most two records.
5. `GET {{baseUrl}}/books?min_price=200&max_price=400` -> 200; only prices in range.
6. `GET {{baseUrl}}/books/1` -> 200 if sample book 1 exists.
7. `POST {{baseUrl}}/books` with title, author and numeric price -> 201. Save returned `data.id` for later tests.
8. `PUT {{baseUrl}}/books/{{bookId}}` with valid title, author and price -> 200.
9. `DELETE {{baseUrl}}/books/{{bookId}}` -> 200.

## Failure tests

10. POST without `title` -> 400 and JSON `message`.
11. POST without `author` -> 400 and JSON `message`.
12. POST with `"price": "abc"` -> 400 and JSON `message`.
13. POST with negative price -> 400.
14. GET `/books?order=SIDEWAYS` -> 400.
15. GET `/books?order_by=password` -> 400.
16. GET `/books?limit=-1` -> 400.
17. GET `/books/999999` -> 404 (assuming that ID does not exist).
18. PUT `/books/999999` -> 404 (assuming that ID does not exist).
19. DELETE `/books/999999` -> 404 (assuming that ID does not exist).
20. GET `/unknown` -> 404.

Check that every error response is JSON with a `message` property.
