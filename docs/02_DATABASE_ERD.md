# 02_DATABASE_ERD.md
# Hajj & Umrah Package Booking System — Database ERD

## Purpose

This document defines the database structure for the Hajj & Umrah Package Booking System.

The design supports:

- Package and tier management
- Multi-pilgrim group booking
- Seat holding and release
- Installment payments
- Payment gateway processing
- Manual payments
- Refunds and cancellations
- Reconciliation
- Vendor expenses
- Inventory tracking
- Reporting
- Auditability

The design intentionally uses a modular monolith approach with PostgreSQL.

---

# ERD Overview

```
users
 |
 | 1:N
 |
bookings
 |
 +----------------+
 |                |
booking_pilgrims  payments
 |                |
 |                |
cancellations     payment_events
                  |
                  |
            reconciliation


packages
 |
 | 1:N
 |
package_tiers
 |
 | 1:N
 |
bookings


bookings
 |
 +-------------+
 |             |
installments  refunds


vendors
 |
vendor_expenses


inventory_items
 |
inventory_transactions


All important mutations
 |
audit_logs
```

---

# 1. Identity Module

## users

Stores pilgrims and administrators.

| Field | Description |
|---|---|
| id | UUID primary key |
| name | User full name |
| email | Unique email |
| phone | Contact number |
| password_hash | Encrypted password |
| role | USER / ADMIN |
| status | ACTIVE / SUSPENDED |
| created_at | Creation time |
| updated_at | Update time |

Rules:

- User cannot access another user's booking.
- Admin access is role controlled.

---

# 2. Package Management Module

## packages

Represents a Hajj or Umrah package.

Example:

Ramadan Umrah — 15 March 2027

| Field | Description |
|---|---|
| id | UUID |
| name | Package name |
| type | HAJJ / RAMADAN_UMRAH / OFF_SEASON_UMRAH / ZIYARAH |
| description | Package details |
| departure_date | Travel date |
| booking_start_date | Opening date |
| booking_end_date | Closing date |
| status | DRAFT / PUBLISHED / ARCHIVED |
| version | Optimistic locking |
| created_at | Timestamp |

---

## package_tiers

Different pricing levels.

Example:

Economy:
180000 BDT

Standard:
220000 BDT

VIP:
300000 BDT

| Field | Description |
|---|---|
| id | UUID |
| package_id | FK packages |
| name | Tier name |
| price | Current price |
| quota | Maximum seats |
| held_seats | Temporary reserved seats |
| confirmed_seats | Confirmed seats |
| version | Optimistic locking |

Rules:

```
held_seats + confirmed_seats <= quota
```

Seat changes require transaction and row locking.

---

# 3. Booking Module

## bookings

One booking belongs to one user.

One booking can contain multiple pilgrims.

| Field | Description |
|---|---|
| id | UUID |
| user_id | FK users |
| package_id | FK packages |
| tier_id | FK package_tiers |
| status | Booking lifecycle |
| payment_mode | FULL / INSTALLMENT |
| unit_price_snapshot | Frozen price |
| tier_name_snapshot | Frozen tier |
| total_amount | Frozen total |
| expires_at | Seat hold expiry |
| version | Optimistic locking |
| deleted_at | Soft delete |
| created_at | Timestamp |

Booking status:

- HELD
- CONFIRMED
- PARTIALLY_PAID
- DEFAULTED
- EXPIRED
- CANCELLED
- COMPLETED

Important:

Booking never depends on current tier price.

---

## booking_pilgrims

Supports group booking.

Example:

Booking:

Faishal + Mother + Father

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| full_name | Pilgrim name |
| passport_number | Passport |
| nationality | Country |
| date_of_birth | DOB |
| passport_expiry | Expiry |
| status | ACTIVE / CANCELLED |

Partial cancellation is handled at pilgrim level.

---

## seat_reservations

Tracks temporary and confirmed seats.

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| tier_id | FK package_tiers |
| quantity | Number of seats |
| status | HELD / CONFIRMED / RELEASED |
| expires_at | Hold expiry |

---

# 4. Installment Module

## installment_plans

Defines payment schedules.

| Field | Description |
|---|---|
| id | UUID |
| name | Plan name |
| description | Rules |

---

## installments

Generated when booking is created.

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| sequence | Installment order |
| amount_due | Required amount |
| amount_paid | Paid amount |
| due_date | Payment deadline |
| grace_end_date | Grace period |
| status | PENDING / PARTIAL / PAID / OVERDUE |

Payment allocation rule:

Oldest unpaid installment first.

Example:

Installment 1 remaining:
50000

Installment 2:
100000

Payment:
80000

Allocation:

50000 → Installment 1

30000 → Installment 2

---

# 5. Payment Module

## payments

Stores received payments.

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| provider | BKASH/NAGAD/VISA/MANUAL |
| method | Payment method |
| amount | Amount |
| currency | BDT/SAR |
| gateway_transaction_id | External ID |
| status | PENDING/SUCCESS/FAILED |
| created_by | Manual payment creator |
| approved_by | Manual payment approver |

Constraint:

```
UNIQUE(provider, gateway_transaction_id)
```

---

## payment_gateway_events

Handles duplicate and out-of-order callbacks.

| Field | Description |
|---|---|
| id | UUID |
| provider | Gateway |
| event_id | External event id |
| transaction_id | Gateway transaction |
| event_type | SUCCESS/PENDING/FAILED |
| payload | Stored event |
| received_at | Timestamp |

Rules:

- Same event processed once.
- Invalid state transitions rejected.

---

## payment_allocations

Maps payments to installments.

| Field | Description |
|---|---|
| id | UUID |
| payment_id | FK payments |
| installment_id | FK installments |
| allocated_amount | Amount |

---

# 6. Manual Payment Module

## manual_payments

Branch office payments.

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| amount | Amount |
| recorded_by | Staff user |
| approved_by | Admin user |
| status | REQUESTED / APPROVED / REJECTED |

Rule:

```
recorded_by != approved_by
```

---

# 7. Cancellation Module

## cancellations

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| reason | Reason |
| status | REQUESTED/APPROVED/REJECTED |
| cancellation_fee | Fee |
| created_at | Timestamp |

---

## cancellation_pilgrims

Supports removing individual pilgrims.

| Field | Description |
|---|---|
| id | UUID |
| cancellation_id | FK cancellations |
| pilgrim_id | FK booking_pilgrims |

---

# 8. Refund Module

## refunds

| Field | Description |
|---|---|
| id | UUID |
| booking_id | FK bookings |
| amount | Refund amount |
| status | REQUESTED/APPROVED/PROCESSING/COMPLETED |
| approved_by | Admin |

Rule:

```
refund <= received payment
```

---

# 9. Reconciliation Module

## reconciliation_records

Tracks payment mismatches.

| Field | Description |
|---|---|
| id | UUID |
| payment_id | FK payments |
| internal_amount | System amount |
| gateway_amount | Provider amount |
| difference | Difference |
| status | MATCHED/MISMATCH/RESOLVED |

Never silently modify payment records.

---

# 10. Vendor Accounting Module

## vendors

| Field | Description |
|---|---|
| id | UUID |
| name | Vendor name |
| currency | SAR/BDT |

---

## vendor_expenses

| Field | Description |
|---|---|
| id | UUID |
| vendor_id | FK vendors |
| booking_id | FK bookings |
| amount | Cost |
| currency | Currency |
| exchange_rate | Conversion |
| amount_bdt | Base amount |

Supports:

SAR expense against BDT collection.

---

# 11. Inventory Module

## inventory_items

Examples:

- Ihram
- Bag
- SIM card

| Field | Description |
|---|---|
| id | UUID |
| name | Item |
| quantity | Available stock |

---

## inventory_transactions

| Field | Description |
|---|---|
| id | UUID |
| item_id | FK inventory_items |
| booking_id | FK bookings |
| type | PURCHASE/ISSUE/RETURN/ADJUSTMENT |
| quantity | Quantity |

---

# 12. Audit Module

## audit_logs

Every important mutation is recorded.

| Field | Description |
|---|---|
| id | UUID |
| actor_id | User who acted |
| action | Action name |
| entity_type | Entity |
| entity_id | Target |
| old_value | Previous data |
| new_value | New data |
| ip_address | Request source |
| created_at | Timestamp |

Examples:

- Admin changed quota 100 → 120
- Admin approved refund
- Payment confirmed

---

# Database Integrity Rules

## Seat Safety

Booking creation:

1. Begin transaction
2. Lock package tier row
3. Check available quota
4. Create booking
5. Reserve seats
6. Commit


## Financial Safety

Never hard delete:

- bookings
- payments
- refunds
- expenses


## Price Freeze

Booking stores:

- unit price snapshot
- tier snapshot
- total snapshot


## Idempotency

Required for:

- booking creation
- payment webhook processing


## Auditability

All state-changing operations create audit records.
