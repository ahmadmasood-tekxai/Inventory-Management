def test_daily_expense_total_matches_client_example(client, auth_headers):
    """Mirrors the client's own example: 200000 cash - 1350 expenses = 198650."""
    client.post("/api/v1/cash", json={"book_date": "2026-09-08", "opening_cash": 200000}, headers=auth_headers)

    for amount in [50, 100, 200, 1000]:
        resp = client.post(
            "/api/v1/expenses",
            json={"amount": amount, "description": "misc", "expense_date": "2026-09-08"},
            headers=auth_headers,
        )
        assert resp.status_code == 201

    summary = client.get("/api/v1/expenses/summary/2026-09-08", headers=auth_headers).json()
    assert float(summary["total_expenses"]) == 1350

    cash = client.get("/api/v1/cash/2026-09-08", headers=auth_headers).json()
    assert float(cash["opening_cash"]) == 200000
    assert float(cash["total_expenses"]) == 1350
    assert float(cash["closing_balance"]) == 198650


def test_cash_entry_upsert_by_date(client, auth_headers):
    client.post("/api/v1/cash", json={"book_date": "2026-09-09", "opening_cash": 1000}, headers=auth_headers)
    resp = client.post("/api/v1/cash", json={"book_date": "2026-09-09", "opening_cash": 5000}, headers=auth_headers)
    assert float(resp.json()["opening_cash"]) == 5000


def test_expense_delete(client, auth_headers):
    created = client.post(
        "/api/v1/expenses", json={"amount": 100, "expense_date": "2026-09-08"}, headers=auth_headers
    ).json()
    resp = client.delete(f"/api/v1/expenses/{created['id']}", headers=auth_headers)
    assert resp.status_code == 204
