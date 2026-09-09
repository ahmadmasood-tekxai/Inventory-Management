def test_purchase_quantity_auto_calculated_matches_client_example(client, auth_headers):
    """Mirrors the client's own example: Rs.20,000 carton at rate Rs.15 => ~1333.33 qty."""
    resp = client.post(
        "/api/v1/purchases",
        json={
            "supplier_name": "ABC Textiles",
            "total_amount": 20000,
            "rate_per_unit": 15,
            "purchase_date": "2026-09-08",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert round(float(body["quantity"]), 2) == round(20000 / 15, 2)


def test_purchase_linked_to_item_increases_stock(client, auth_headers):
    item = client.post(
        "/api/v1/items",
        json={"code": "PUR1", "name": "Purchase Test Item", "opening_stock": 0},
        headers=auth_headers,
    ).json()

    client.post(
        "/api/v1/purchases",
        json={
            "item_id": item["id"], "total_amount": 1500, "rate_per_unit": 10, "purchase_date": "2026-09-08",
        },
        headers=auth_headers,
    )

    detail = client.get(f"/api/v1/items/{item['id']}", headers=auth_headers).json()
    assert float(detail["remaining_stock"]) == 150
    assert float(detail["total_purchased"]) == 150


def test_purchase_rejects_zero_rate(client, auth_headers):
    resp = client.post(
        "/api/v1/purchases",
        json={"total_amount": 1000, "rate_per_unit": 0, "purchase_date": "2026-09-08"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
