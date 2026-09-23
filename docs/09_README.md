# 09_README.md
# Hajj & Umrah Package Booking System

## 1. Project Overview

The Hajj & Umrah Package Booking System is a full-stack application for managing package browsing, pilgrim bookings, payments, installments, cancellations, refunds, reconciliation, and administrative operations.

The project demonstrates professional engineering practices while keeping the implementation scope realistic for an AI-assisted development workflow.

---

# 2. Technology Stack

## Frontend

- Next.js
- TypeScript

## Backend

- NestJS
- TypeScript

## Database

- PostgreSQL

---

# 3. Architecture

The system follows a Modular Monolith architecture.

```
Next.js Frontend

        |

NestJS Backend

        |

PostgreSQL Database
```

Backend modules:

- Authentication
- Users
- Packages
- Bookings
- Pilgrims
- Payments
- Installments
- Refunds
- Reconciliation
- Vendors
- Inventory
- Reports
- Audit

---

# 4. Local Setup

## Requirements

Install:

- Node.js
- PostgreSQL
- npm/pnpm


---

# Backend Setup

Navigate:

```
cd backend
```

Install:

```
npm install
```

Environment:

```
DATABASE_URL=postgresql://user:password@localhost:5432/hajj
JWT_SECRET=secret
```

Run migration:

```
npm run migration:run
```

Start:

```
npm run start:dev
```

---

# Frontend Setup

Navigate:

```
cd frontend
```

Install:

```
npm install
```

Start:

```
npm run dev
```

---

# 5. Main Features

## User Features

- Register/login
- Browse packages
- Select package tier
- Add multiple pilgrims
- Create booking
- Full payment selection
- Installment selection
- View booking status
- View payment status
- Request cancellation


## Admin Features

- Manage packages
- Manage tiers and quotas
- View bookings
- Approve manual payments
- Track installments
- Manage refunds
- Review reconciliation
- Track vendor expenses
- Manage inventory
- View reports

---

# 6. Engineering Decisions

## 6.1 How seat overselling is prevented

Seat reservation is handled using PostgreSQL transactions.

Booking flow:

1. Start transaction.
2. Lock package tier row.
3. Check available quota.
4. Create booking.
5. Reserve seats.
6. Commit transaction.


The row lock prevents two users from consuming the same final seat.

---

## 6.2 How duplicate payment webhooks are handled

Payment events are stored separately.

The system uses:

```
UNIQUE(provider, gateway_transaction_id)
```

and:

```
UNIQUE(provider, event_id)
```

If the same webhook arrives multiple times, it is processed only once.

---

## 6.3 How out-of-order payment events are handled

Payment states follow valid transitions.

Example:

Invalid:

```
SUCCESS -> PENDING
```

The backend rejects invalid state changes.

Payment history is preserved through gateway events.

---

## 6.4 How reporting remains fast for large scale

The system can scale reporting using:

- Database indexes
- Pagination
- Cached summaries
- Background aggregation jobs
- Reporting tables
- Read replicas when required

Transactional data remains optimized for correctness.

---

# 7. Important Business Rules

## Price Freeze

After booking confirmation:

- Tier name is frozen.
- Unit price is frozen.
- Total amount is frozen.

Package price changes do not affect old bookings.


## Installment Allocation

Payments are applied:

Oldest unpaid installment first.


## Refund Safety

Refund amount cannot exceed received payment.


## Financial Records

The system avoids hard deletion of:

- bookings
- payments
- refunds
- expenses

---

# 8. Scope Limitations

The following are designed but not fully integrated:

- Real bKash merchant integration
- Real Nagad integration
- Real VISA processing
- Production deployment
- Kubernetes
- Microservices
- Full ERP accounting

The project focuses on correct workflows and engineering decisions.

---

# 9. Testing Focus

Important tests:

- Authentication
- Authorization
- Seat concurrency
- Duplicate webhook handling
- Payment allocation
- Refund validation
- Audit logging

---

# 10. Submission Checklist

The project should include:

- Source code
- Database schema
- ERD
- API documentation
- System design
- Setup instructions
- Engineering explanation
