# 07_API_SPECIFICATION.md
# Hajj & Umrah Package Booking System
# REST API Specification

## 1. API Overview

Base URL:

```
/api/v1
```

Architecture:

Frontend:

Next.js

↓

Backend:

NestJS REST API

↓

Database:

PostgreSQL


All protected APIs require authentication.

Authentication:

```
Authorization: Bearer <token>
```

---

# 2. Common API Rules

## Response Format

Success:

```json
{
  "data": {},
  "message": "Success"
}
```


Error:

```json
{
  "code": "ERROR_CODE",
  "message": "Readable message"
}
```


---

## Pagination

List APIs support:

```
?page=1
&limit=20
```


---

## Idempotency

Required for retry-sensitive operations.

Header:

```
Idempotency-Key: unique-request-id
```

Used for:

- Booking creation
- Payment confirmation
- Refund processing

---

# 3. Authentication APIs

## Register

POST

```
/auth/register
```

Public


Request:

```json
{
  "name": "Faishal",
  "email": "user@example.com",
  "password": "password"
}
```


Rules:

- Creates USER role only.
- Admin creation is controlled internally.


---

## Login

POST

```
/auth/login
```


Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```


Response:

```json
{
  "access_token": "jwt-token"
}
```

---

## Current User

GET

```
/auth/me
```

Returns authenticated user information.

---

# 4. Package APIs

# User Package APIs

## List Published Packages

GET

```
/packages
```


Query:

```
?page=1
&type=RAMADAN_UMRAH
```


Response:

```json
[
 {
  "id":"uuid",
  "name":"Ramadan Umrah",
  "departure_date":"2027-03-15",
  "tiers":[]
 }
]
```


---

## Package Details

GET

```
/packages/:id
```


Returns:

- Package information
- Available tiers
- Current seat information


---

# Admin Package APIs

## Create Package

POST

```
/admin/packages
```


Role:

ADMIN


Request:

```json
{
"name":"Ramadan Umrah",
"type":"RAMADAN_UMRAH",
"departure_date":"2027-03-15"
}
```


---

## Update Package

PATCH

```
/admin/packages/:id
```


Request:

```json
{
"name":"Updated Name",
"version":2
}
```


Uses optimistic locking.

If version mismatch:

```
409 CONFLICT
```

---

## Archive Package

PATCH

```
/admin/packages/:id/archive
```

---

# 5. Package Tier APIs

## Create Tier

POST

```
/admin/packages/:packageId/tiers
```


Request:

```json
{
"name":"VIP",
"price":300000,
"quota":20
}
```


---

## Update Tier

PATCH

```
/admin/tiers/:id
```


Request:

```json
{
"price":320000,
"version":1
}
```


Rules:

- Version must match.
- Quota cannot be below confirmed seats.

---

# 6. Booking APIs

## Create Booking

POST

```
/bookings
```


Required Header:

```
Idempotency-Key
```


Request:

```json
{
"tier_id":"uuid",
"payment_mode":"INSTALLMENT",
"pilgrims":[
 {
  "name":"Faishal",
  "passport_number":"AB123",
  "nationality":"Bangladesh"
 }
]
}
```


Backend flow:

1. Validate request.
2. Start database transaction.
3. Lock tier row.
4. Check quota.
5. Create seat reservation.
6. Create booking.
7. Create pilgrims.
8. Generate installment schedule.
9. Save audit.
10. Commit.


Possible errors:

```
409 SEAT_UNAVAILABLE
409 IDEMPOTENCY_CONFLICT
```

---

## My Bookings

GET

```
/bookings/me
```


Returns only authenticated user's bookings.


---

## Booking Details

GET

```
/bookings/:id
```


Authorization:

USER:

Only own booking.


ADMIN:

All bookings.


---

## Cancel Booking

POST

```
/bookings/:id/cancel
```


Request:

```json
{
"reason":"Personal reason"
}
```


---

# 7. Pilgrim APIs

## Cancel Individual Pilgrim

POST

```
/bookings/:bookingId/pilgrims/:pilgrimId/cancel
```


Supports partial cancellation.

---

# 8. Payment APIs

# User Payment

## Create Payment Intent

POST

```
/payments
```


Header:

```
Idempotency-Key
```


Request:

```json
{
"booking_id":"uuid",
"amount":100000,
"provider":"BKASH"
}
```


---

## Payment Status

GET

```
/payments/:bookingId
```


---

# Gateway Webhook

POST

```
/payments/webhook/:provider
```


Example:

```
/payments/webhook/bkash
```


Request:

```json
{
"event_id":"evt123",
"transaction_id":"BKASH123",
"status":"SUCCESS"
}
```


Backend:

1. Verify gateway data.
2. Store event.
3. Check duplicate.
4. Validate state transition.
5. Update payment.
6. Allocate payment.
7. Update booking.


---

# 9. Manual Payment APIs

## Create Manual Payment

POST

```
/admin/manual-payments
```


Request:

```json
{
"booking_id":"uuid",
"amount":50000
}
```


Creates:

REQUESTED


---

## Approve Manual Payment

PATCH

```
/admin/manual-payments/:id/approve
```


Rules:

```
recorded_by != approved_by
```


Creates audit record.

---

# 10. Installment APIs

## View Installments

GET

```
/bookings/:id/installments
```


Response:

```json
[
{
"sequence":1,
"amount_due":100000,
"amount_paid":50000,
"status":"PARTIAL"
}
]
```


---

## Pay Installment

POST

```
/installments/:id/pay
```


Payment allocation:

Oldest unpaid installment first.

---

# 11. Refund APIs

## Request Refund

POST

```
/refunds
```


Request:

```json
{
"booking_id":"uuid",
"reason":"Cancellation"
}
```


Status:

REQUESTED


---

## Approve Refund

PATCH

```
/admin/refunds/:id/approve
```


---

## Process Refund

PATCH

```
/admin/refunds/:id/process
```


---

# 12. Reconciliation APIs

## List Mismatches

GET

```
/admin/reconciliation
```


Returns:

- Internal amount
- Gateway amount
- Difference
- Status


---

## Resolve Mismatch

PATCH

```
/admin/reconciliation/:id/resolve
```


---

# 13. Vendor APIs

## Vendors

GET

```
/admin/vendors
```


POST

```
/admin/vendors
```


---

## Vendor Expenses

POST

```
/admin/vendor-expenses
```


Request:

```json
{
"vendor_id":"uuid",
"amount":10000,
"currency":"SAR",
"exchange_rate":32.1
}
```


---

# 14. Inventory APIs

## Items

GET

```
/admin/inventory/items
```


POST

```
/admin/inventory/items
```


---

## Inventory Transaction

POST

```
/admin/inventory/transactions
```


Types:

- PURCHASE
- ISSUE
- RETURN
- ADJUSTMENT


---

# 15. Reporting APIs

## Dashboard Summary

GET

```
/admin/reports/dashboard
```


Returns:

- Total bookings
- Confirmed bookings
- Collections
- Outstanding installments
- Refunds
- Seat availability


---

# 16. Audit APIs

## Audit Logs

GET

```
/admin/audit-logs
```


Returns:

- Actor
- Action
- Entity
- Old value
- New value
- Timestamp


---

# 17. Security Requirements

Backend must enforce:

- Authentication
- Authorization
- Ownership checks
- Input validation
- Rate limiting where required


Never trust:

- frontend payment status
- frontend user ID
- frontend role


---

# 18. Critical Engineering Behaviors

## Seat Overselling Prevention

Use:

- PostgreSQL transaction
- SELECT FOR UPDATE
- Seat reservation table


---

## Duplicate Payment Protection

Use:

Unique:

```
(provider, gateway_transaction_id)
```


---

## Out-of-order Events

Use:

- Event history
- Valid state transitions


Example:

Invalid:

```
SUCCESS -> PENDING
```


---

## Financial Integrity

Never hard delete:

- payments
- refunds
- expenses
- bookings


All changes must be auditable.
