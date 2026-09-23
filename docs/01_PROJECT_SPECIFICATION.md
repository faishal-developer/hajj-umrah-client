# 01_PROJECT_SPECIFICATION.md
# Hajj & Umrah Package Booking System

## 1. Project Overview

The Hajj & Umrah Package Booking System is a full-stack web application that manages the complete journey of package selection, pilgrim booking, payment collection, installment management, cancellation, refund, and administrative reporting.

The system has two primary users:

1. Pilgrim/User
2. Admin

The project is designed as a professionally engineered modular monolith using Next.js, NestJS, and PostgreSQL.

The goal is not to build a complete travel ERP. The goal is to implement the important business workflows correctly with strong engineering practices.

---

# 2. Technology Stack

## Frontend

- Next.js
- TypeScript

## Backend

- NestJS
- TypeScript
- REST API

## Database

- PostgreSQL

## Architecture Style

Modular Monolith

---

# 3. System Users

## 3.1 Pilgrim/User

A user can:

- Register and authenticate
- Browse available Hajj and Umrah packages
- View package details
- Select package tier
- Add multiple pilgrims
- Create a booking
- Choose full payment or installment payment
- View own bookings
- View payment and installment status
- Request booking or pilgrim cancellation

---

## 3.2 Admin

An admin can:

- Create and manage packages
- Manage package tiers and quotas
- View all bookings
- Track payments and installments
- Approve manual payments
- Manage cancellations
- Approve refunds
- View financial reports
- Review reconciliation mismatches
- Manage vendor expenses
- Manage pilgrim inventory items

---

# 4. Package Management

A package represents a Hajj or Umrah offering.

Example:

Ramadan Umrah — 15 March 2027

A package contains:

- Name
- Package type
- Description
- Departure date
- Booking start date
- Booking closing date
- Status


Supported package types:

- Hajj
- Ramadan Umrah
- Off-season Umrah
- Ziyarah

Package status:

- Draft
- Published
- Archived


---

# 5. Package Tier Management

Each package contains multiple tiers.

Example:

## Economy

Price:
180,000 BDT

Quota:
100 seats


## Standard

Price:
220,000 BDT

Quota:
50 seats


## VIP

Price:
300,000 BDT

Quota:
20 seats


Each tier contains:

- Tier name
- Price
- Seat quota
- Held seats
- Confirmed seats


Important rule:

The system must never oversell seats.

If only one seat remains and two users attempt booking simultaneously, only one booking can successfully reserve the seat.

---

# 6. Booking Management

A booking belongs to one user.

A booking can contain multiple pilgrims.

Example:

User:

Faishal

Booking:

Ramadan Umrah
Standard Tier

Pilgrims:

1. Faishal
2. Mother
3. Father


The system must support:

- Group booking
- Multiple passports
- Individual pilgrim cancellation


A booking contains:

- User
- Package
- Tier
- Pilgrim list
- Payment mode
- Price snapshot
- Booking status


Booking lifecycle:

- Held
- Pending Payment
- Partially Paid
- Confirmed
- Defaulted
- Expired
- Cancelled
- Completed


---

# 7. Seat Reservation and Holding

When a user creates a booking:

Seats are temporarily held.

Example:

User selects three pilgrims.

System:

- Holds three seats
- Creates pending booking
- Waits for payment


A configurable payment holding period is used.

Example:

payment_hold_minutes = 30


If payment is not completed:

- Booking expires
- Held seats are released


Seat management must use:

- Database transaction
- Row locking
- Concurrency-safe update


---

# 8. Price Freezing

Once a booking is confirmed, the price must not change.

Example:

Today:

VIP price:
300,000 BDT


Next week:

Admin changes VIP price:
320,000 BDT


Existing booking remains:

300,000 BDT


Therefore booking stores:

- Tier name snapshot
- Unit price snapshot
- Total price snapshot


The booking must not depend on the current package tier price.

---

# 9. Payment System

The system supports:

## Full Payment

User pays the complete amount.

## Installment Payment

User pays according to a generated schedule.


Payment sources:

- Payment gateway
- Manual branch payment


Supported providers:

- bKash
- Nagad
- VISA
- Manual


The project uses simulated payment adapters instead of real merchant integrations.

---

# 10. Installment Management

Installments are generated during booking creation.

Each installment contains:

- Sequence number
- Amount due
- Amount paid
- Due date
- Grace period
- Status


Installment statuses:

- Pending
- Partial
- Paid
- Overdue


Payment allocation rule:

Payments must apply to the oldest unpaid installment first.

Example:

Installment 1:

Remaining:
50,000


Installment 2:

Remaining:
100,000


User pays:

80,000


Allocation:

50,000 → Installment 1

30,000 → Installment 2

---

# 11. Overdue and Default Handling

If an installment is unpaid:

Before due date:

Pending

After due date:

Overdue


After grace period:

Booking becomes:

Defaulted


Production implementation may use:

- Scheduled jobs
- Queue workers

---

# 12. Payment Gateway Handling

The frontend must never decide payment success.

Incorrect:

User returns from gateway → frontend marks paid


Correct:

Gateway

↓

Webhook

↓

Backend verification

↓

Payment saved

↓

Booking updated


The backend is the source of truth.

---

# 13. Duplicate and Out-of-Order Payments

Payment gateways may send duplicate events.

Example:

Same transaction:

BKASH123

Webhook 1

Webhook 2

Webhook 3


The system must process it only once.

Solution:

Unique constraint:

(provider, gateway_transaction_id)


Out-of-order events must not create invalid state changes.

Example:

SUCCESS cannot become PENDING.

The system validates payment state transitions.

---

# 14. Manual Payment Approval

Branch payments require dual control.

Example:

Staff A:

Records payment


Staff B:

Approves payment


Rules:

- Creator cannot approve own payment.
- Approval actions are audited.

---

# 15. Cancellation and Refund

The system supports:

## Full Cancellation

Entire booking cancelled.


## Partial Cancellation

Individual pilgrim removed.

Example:

Booking:

- Faishal
- Mother
- Father


Father cancels.

Result:

- Two pilgrims remain
- One seat released


Cancellation calculation considers:

- Days before departure
- Cancellation policy
- Vendor expenses already paid


---

# 16. Refund Lifecycle

Refunds follow:

Request

↓

Approval

↓

Processing

↓

Completed


Refund statuses:

- Requested
- Approved
- Processing
- Completed
- Rejected


Important rule:

Refund amount can never exceed received payment.

---

# 17. Reconciliation

The system compares internal payments with gateway settlements.

Example:

Internal:

200,000 BDT


Gateway:

190,000 BDT


Difference:

10,000 BDT


The system creates a mismatch record.

Statuses:

- Matched
- Mismatch
- Under Review
- Resolved


The system must never silently modify financial records.

---

# 18. Vendor Expense Management

The system tracks vendor expenses.

Examples:

- Hotel
- Airline
- Transport
- Visa processor


Vendor costs may use SAR.

Store:

- Amount
- Currency
- Exchange rate
- BDT equivalent


Example:

10,000 SAR

Exchange rate:

32.10

BDT:

321,000

---

# 19. Inventory Management

The system tracks pilgrim items.

Examples:

- Ihram
- Bags
- SIM cards


Inventory operations:

- Purchase
- Issue
- Return
- Adjustment


Issued items become consumption records.

---

# 20. Authentication and Authorization

Minimum roles:

- USER
- ADMIN


Rules:

Users:

- Can only access their own bookings.
- Cannot access another user's information.


Admins:

- Can access administrative functions.


All state-changing operations require authentication and authorization.

---

# 21. Audit Logging

Every important mutation must be auditable.

Audit stores:

- Actor
- Action
- Entity type
- Entity ID
- Old value
- New value
- Timestamp
- IP address


Examples:

- Admin changed quota.
- Payment approved.
- Refund completed.

---

# 22. Reporting

Admin dashboard should provide:

## Booking Reports

- Total bookings
- Confirmed bookings
- Pending bookings
- Cancelled bookings


## Financial Reports

- Total collections
- Outstanding payments
- Refunds
- Vendor expenses


## Seat Reports

- Total quota
- Held seats
- Confirmed seats
- Remaining seats


---

# 23. Engineering Requirements

The system must demonstrate:

## Database Integrity

- Transactions
- Constraints
- Proper relationships


## Concurrency Safety

- Row locking for seat reservation
- Safe concurrent booking


## Data Safety

- Soft delete
- Append-only financial history


## Reliability

- Idempotency
- Event deduplication
- State validation


## Maintainability

- Modular backend
- Clear API contracts
- Automated testing

---

# 24. Out of Scope

Not required:

- Real payment merchant integration
- Production deployment
- Microservices
- Kubernetes
- Full accounting ERP
- Advanced BI platform


The design should explain how these can be added later.

---

# 25. Final Success Criteria

The project is successful when:

- Users can complete package booking.
- Group pilgrims are supported.
- Seats cannot be oversold.
- Payment flows are reliable.
- Installments work correctly.
- Refunds and cancellations are traceable.
- Admins can manage operations.
- All important actions are auditable.
- The system demonstrates professional engineering decisions.
