# Graph Report - docs  (2026-09-23)

## Corpus Check
- Corpus is ~18,057 words - fits in a single context window. You may not need a graph.

## Summary
- 47 nodes · 80 edges · 11 communities (6 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 16,000 input · 4,500 output

## Community Hubs (Navigation)
- Core Schema & Operational Tables
- Admin Operations & Financial Controls
- Client & Pilgrim Workflows
- Architecture & System Design
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10

## God Nodes (most connected - your core abstractions)
1. `bookings` - 16 edges
2. `users` - 7 edges
3. `payments` - 7 edges
4. `Admin Frontend Integration Guide` - 7 edges
5. `packages` - 5 edges
6. `package_tiers` - 4 edges
7. `installments` - 4 edges
8. `manual_payments` - 4 edges
9. `vendor_expenses` - 4 edges
10. `inventory_transactions` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Client Pilgrim Workflows & Swagger` --references--> `bookings`  [EXTRACTED]
  CLIENT_FRONTEND_GUIDE.md → 08_SCHEMA.sql
- `Admin Maker-Checker Dual Control` --implements--> `manual_payments`  [EXTRACTED]
  ADMIN_FRONTEND_GUIDE.md → 08_SCHEMA.sql
- `Admin Gateway Reconciliation & Batches` --implements--> `reconciliation_records`  [EXTRACTED]
  ADMIN_FRONTEND_GUIDE.md → 08_SCHEMA.sql
- `Admin Multi-Currency Vendor Accounting` --implements--> `vendor_expenses`  [EXTRACTED]
  ADMIN_FRONTEND_GUIDE.md → 08_SCHEMA.sql
- `Admin Pilgrim Inventory Tracking` --implements--> `inventory_transactions`  [EXTRACTED]
  ADMIN_FRONTEND_GUIDE.md → 08_SCHEMA.sql

## Import Cycles
- None detected.

## Communities (11 total, 5 thin omitted)

### Community 0 - "Core Schema & Operational Tables"
Cohesion: 0.33
Nodes (9): idx_installment_booking, idx_payment_booking, installment_plans, installments, payment_allocations, payment_gateway_events, payments, unique_gateway_transaction (+1 more)

### Community 1 - "Admin Operations & Financial Controls"
Cohesion: 0.25
Nodes (8): audit_logs, idempotency_records, idx_audit_entity, manual_payments, refunds, users, Admin Audit Mutation Trail, Admin Maker-Checker Dual Control

### Community 2 - "Client & Pilgrim Workflows"
Cohesion: 0.29
Nodes (8): booking_pilgrims, bookings, cancellation_pilgrims, cancellations, idx_booking_status, idx_booking_user, Client-Side Frontend Integration Guide, Client Pilgrim Workflows & Swagger

### Community 3 - "Architecture & System Design"
Cohesion: 0.25
Nodes (8): reconciliation_records, vendor_expenses, vendors, Admin Frontend Integration Guide, Admin Package & Tier Endpoints, Admin Gateway Reconciliation & Batches, Admin Executive Analytics & Reports, Admin Multi-Currency Vendor Accounting

### Community 4 - "Community 4"
Cohesion: 0.40
Nodes (5): idx_packages_departure_date, idx_packages_status, package_tiers, packages, seat_reservations

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (3): inventory_items, inventory_transactions, Admin Pilgrim Inventory Tracking

## Knowledge Gaps
- **9 isolated node(s):** `installment_plans`, `Admin Package & Tier Endpoints`, `Admin Cancellation & Refund Processing`, `Admin Executive Analytics & Reports`, `Client-Side Frontend Integration Guide` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 9 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bookings` connect `Client & Pilgrim Workflows` to `Core Schema & Operational Tables`, `Admin Operations & Financial Controls`, `Architecture & System Design`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Why does `Admin Frontend Integration Guide` connect `Architecture & System Design` to `Admin Operations & Financial Controls`, `Community 5`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `vendor_expenses` connect `Architecture & System Design` to `Core Schema & Operational Tables`, `Client & Pilgrim Workflows`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `installment_plans`, `Admin Package & Tier Endpoints`, `Admin Cancellation & Refund Processing` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._