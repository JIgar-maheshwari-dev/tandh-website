This folder is intentionally empty in a fresh copy of the project.

Once you run the app and people sign up / place orders, these files
will appear here automatically:

- `tandh.db` — the SQLite database (users + orders). Open it with any
  SQLite browser tool (e.g. "DB Browser for SQLite") or the `sqlite3`
  CLI if you want to run raw SQL against it.
- `users.csv` — every registered user (id, name, email, provider,
  signup date), regenerated on every signup. Open directly in Excel or
  Google Sheets.
- `orders.csv` — every order placed, with items, shipping address, and
  payment status, regenerated on every order/payment update. Open
  directly in Excel or Google Sheets.

None of these are committed to version control (see .gitignore) since
they contain real customer data once the site is live.
