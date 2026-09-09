def _create_item(client, auth_headers, code="1500C", opening_stock=20):
    resp = client.post(
        "/api/v1/items",
        json={"code": code, "name": f"Item {code}", "unit": "pcs", "opening_stock": opening_stock, "low_stock_threshold": 5},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_create_item_sets_remaining_stock_to_opening(client, auth_headers):
    item = _create_item(client, auth_headers, opening_stock=20)
    assert float(item["remaining_stock"]) == 20
    assert item["is_low_stock"] is False


def test_duplicate_item_code_rejected(client, auth_headers):
    _create_item(client, auth_headers, code="520")
    resp = client.post(
        "/api/v1/items",
        json={"code": "520", "name": "Duplicate", "opening_stock": 10},
        headers=auth_headers,
    )
    assert resp.status_code == 409


def test_sale_reduces_remaining_stock_correctly(client, auth_headers):
    """Mirrors the client's own example: 20 stock, sell 5, expect 15 remaining."""
    item = _create_item(client, auth_headers, code="1500C", opening_stock=20)

    resp = client.post(
        "/api/v1/sales",
        json={"item_id": item["id"], "quantity": 5, "sale_date": "2026-09-08", "note": "Sold to shop A"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    assert float(resp.json()["remaining_stock_after"]) == 15

    detail = client.get(f"/api/v1/items/{item['id']}", headers=auth_headers).json()
    assert float(detail["remaining_stock"]) == 15
    assert float(detail["total_sold"]) == 5


def test_cannot_sell_more_than_remaining_stock(client, auth_headers):
    item = _create_item(client, auth_headers, code="777", opening_stock=10)
    resp = client.post(
        "/api/v1/sales",
        json={"item_id": item["id"], "quantity": 999, "sale_date": "2026-09-08"},
        headers=auth_headers,
    )
    assert resp.status_code == 400


def test_low_stock_flag_after_multiple_sales(client, auth_headers):
    item = _create_item(client, auth_headers, code="LOWSTK", opening_stock=10)
    client.post(
        "/api/v1/sales",
        json={"item_id": item["id"], "quantity": 6, "sale_date": "2026-09-08"},
        headers=auth_headers,
    )
    detail = client.get(f"/api/v1/items/{item['id']}", headers=auth_headers).json()
    assert float(detail["remaining_stock"]) == 4
    assert detail["is_low_stock"] is True


def test_item_detail_includes_movement_history(client, auth_headers):
    item = _create_item(client, auth_headers, code="HIST1", opening_stock=50)
    client.post(
        "/api/v1/sales",
        json={"item_id": item["id"], "quantity": 10, "sale_date": "2026-09-08"},
        headers=auth_headers,
    )
    detail = client.get(f"/api/v1/items/{item['id']}", headers=auth_headers).json()
    assert len(detail["movements"]) == 2  # OPENING + SALE
