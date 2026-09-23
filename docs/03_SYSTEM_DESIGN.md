# 03_SYSTEM_DESIGN.md

# Hajj & Umrah Package Booking System

# System Design Specification

## 1. Design Objective

This document describes the high-level architecture and engineering
decisions of the Hajj & Umrah Package Booking System.

The design goal is:

-   Build a reliable booking platform.
-   Maintain financial and booking correctness.
-   Handle concurrency safely.
-   Keep implementation achievable with an AI-assisted development
    workflow.
-   Provide a path for future scaling.

The selected architecture is a Modular Monolith.

------------------------------------------------------------------------

# 2. High-Level Architecture

                             Users
                               |
                               |
                         CDN / Browser
                               |
                               |
                        Next.js Frontend
                               |
                               |
                        REST API Layer
                               |
                               |
                      NestJS Modular Monolith
                               |
            ------------------------------------------------
            |        |        |        |        |          |
          Auth   Catalog  Booking Payment  Admin  Reports
            |        |        |        |        |          |
            ------------------------------------------------
                               |
                               |
                        PostgreSQL Database
                               |
                  -----------------------------
                  |             |             |
               Redis        Queue Jobs     Storage

------------------------------------------------------------------------

# 3. Architecture Decision

## Modular Monolith

The backend is a single deployable application with clear internal
modules.

Reason:

-   Easier development.
-   Easier debugging.
-   Strong database consistency.
-   Suitable for assignment scope.
-   Allows future extraction of services if needed.

The system does not require microservices.

------------------------------------------------------------------------

# 4. Backend Module Design

    src/

    auth/
    users/

    packages/
    tiers/

    bookings/
    pilgrims/
    seat-reservation/

    payments/
    installments/

    cancellations/
    refunds/

    reconciliation/

    vendors/
    inventory/

    reports/
    audit/

    common/

------------------------------------------------------------------------

# 5. Module Responsibilities

## Authentication Module

Responsibilities:

-   Registration
-   Login
-   Authentication
-   Authorization
-   Role management

Roles:

-   USER
-   ADMIN

------------------------------------------------------------------------

## Package Module

Responsibilities:

-   Manage Hajj/Umrah packages.
-   Manage package tiers.
-   Manage quota.

Important rules:

-   Published packages are visible to users.
-   Tier quota cannot be reduced below confirmed seats.

------------------------------------------------------------------------

## Booking Module

Responsibilities:

-   Create bookings.
-   Manage pilgrims.
-   Reserve seats.
-   Manage booking lifecycle.

Booking lifecycle:

    HELD
     |
    PENDING_PAYMENT
     |
    CONFIRMED
     |
    COMPLETED

Alternative states:

-   PARTIALLY_PAID
-   DEFAULTED
-   EXPIRED
-   CANCELLED

------------------------------------------------------------------------

# 6. Critical Engineering Design

# 6.1 Seat Reservation Design

Seat availability is a shared resource.

Problem:

Example:

Available seats:

    1

Two users submit booking requests simultaneously.

Without protection:

    User A reads 1 seat
    User B reads 1 seat

    Both create booking

Result:

Overselling.

------------------------------------------------------------------------

## Solution

Use PostgreSQL transaction and row locking.

Flow:

    BEGIN TRANSACTION

    SELECT package_tier
    FOR UPDATE

    Check available quota

    Create booking

    Create seat reservation

    Update held seats

    COMMIT

Only one transaction can modify the same tier row at a time.

------------------------------------------------------------------------

# 6.2 Seat Holding

When booking is created:

Seats are temporarily reserved.

Example:

Payment hold:

    30 minutes

During this time:

    Seat status = HELD
    Booking status = PENDING_PAYMENT

If payment is not completed:

    Booking = EXPIRED

    Seats = RELEASED

Production implementation:

-   Scheduled job
-   Queue worker

------------------------------------------------------------------------

# 6.3 Price Freeze Design

Package prices can change.

Example:

Today:

VIP:

300000 BDT

Later:

VIP:

320000 BDT

Old booking must remain:

300000 BDT

Therefore booking stores:

-   Tier name snapshot
-   Unit price snapshot
-   Total amount snapshot

Booking does not depend on current tier price.

------------------------------------------------------------------------

# 6.4 Optimistic Locking

Used for:

-   Package updates
-   Tier updates
-   Booking updates

Each editable record contains:

    version

Example:

Current:

    version = 5

Update:

    WHERE id = ?
    AND version = 5

If no row changes:

Another user modified the record.

Return:

    409 Conflict

------------------------------------------------------------------------

# 6.5 Idempotency Design

Used for operations that can be retried.

Required:

-   Booking creation
-   Payment processing
-   Webhook handling

Client sends:

    Idempotency-Key

Backend stores:

-   Key
-   Endpoint
-   Request hash
-   Response

Duplicate request:

Return previous result.

------------------------------------------------------------------------

# 7. Payment Architecture

Payment flow:

    User

     |

    Payment Gateway

     |

    Webhook

     |

    Backend Verification

     |

    Payment Record

     |

    Installment Allocation

     |

    Booking Update

------------------------------------------------------------------------

## Important Rule

Frontend redirect is not trusted.

Incorrect:

    Frontend says payment success

Correct:

    Backend verifies gateway event

------------------------------------------------------------------------

# 8. Payment Event Processing

Payment gateways may send:

-   Duplicate events.
-   Delayed events.
-   Out-of-order events.

Solution:

Store payment events.

Example:

    payment_gateway_events

Rules:

-   Same event processed once.
-   Invalid status transitions rejected.

Example:

Invalid:

    SUCCESS -> PENDING

------------------------------------------------------------------------

# 9. Installment Architecture

Installment schedule is generated during booking creation.

Each installment:

-   Amount due
-   Amount paid
-   Due date
-   Grace date
-   Status

Payment allocation:

Oldest unpaid installment first.

Example:

    Installment 1:
    Remaining 50000

    Installment 2:
    Remaining 100000


    Payment:
    80000


    Allocation:

    50000 -> Installment 1

    30000 -> Installment 2

------------------------------------------------------------------------

# 10. Cancellation and Refund Architecture

Cancellation flow:

    User Request

          |

    Admin Review

          |

    Fee Calculation

          |

    Refund Request

          |

    Approval

          |

    Processing

          |

    Completed

Supports:

-   Full booking cancellation.
-   Partial pilgrim cancellation.

Refund rule:

    Refund <= Received Payment

------------------------------------------------------------------------

# 11. Manual Payment Architecture

Branch payment requires dual control.

Flow:

    Staff Records Payment

              |

    Admin Approves Payment

Rule:

    recorded_by != approved_by

All actions are audited.

------------------------------------------------------------------------

# 12. Reconciliation Architecture

Purpose:

Compare internal payment data with gateway settlements.

Example:

Internal:

    200000 BDT

Gateway:

    190000 BDT

System creates:

    Mismatch Record

Statuses:

-   MATCHED
-   MISMATCH
-   UNDER_REVIEW
-   RESOLVED

The system never silently changes payment records.

------------------------------------------------------------------------

# 13. Reporting Architecture

For current implementation:

Use:

-   Indexed PostgreSQL queries.
-   Pagination.
-   Filtered reports.

For larger scale:

    Transactional Database

            |

    Background Jobs

            |

    Reporting Tables

            |

    Dashboard

Possible improvements:

-   Redis cache.
-   Materialized views.
-   Read replicas.

------------------------------------------------------------------------

# 14. Scaling Strategy

The assignment mentions approximately millions of users.

The design supports future scaling through:

## Application

-   Stateless API servers.
-   Horizontal scaling.

## Database

-   Proper indexes.
-   Query optimization.
-   Read replicas.

## Async Processing

Use workers for:

-   Payment events.
-   Expiry processing.
-   Reminder generation.
-   Report generation.

## Caching

Use Redis for:

-   Package browsing.
-   Frequently accessed reports.

------------------------------------------------------------------------

# 15. Data Integrity Rules

## Financial Records

Never hard delete:

-   Payments
-   Refunds
-   Expenses
-   Bookings

Use:

-   Status
-   Deleted timestamp
-   Audit history

------------------------------------------------------------------------

## Auditability

Every important mutation creates:

-   Actor
-   Action
-   Entity
-   Old value
-   New value
-   Timestamp

------------------------------------------------------------------------

# 16. Security Design

Requirements:

-   Password hashing.
-   Authentication.
-   Role-based access.
-   Input validation.
-   Ownership checks.

User:

Can access only own bookings.

Admin:

Can access administrative operations.

------------------------------------------------------------------------

# 17. Deployment Design

Simple deployment:

                    Users

                      |

                  Next.js

                      |

                  NestJS API

                      |

                 PostgreSQL

Optional future components:

-   Redis
-   Queue workers
-   Object storage
-   Read replicas

------------------------------------------------------------------------

# 18. Out of Scope

Not implemented:

-   Microservices.
-   Kubernetes.
-   Full ERP accounting.
-   Real payment merchant integration.
-   Enterprise BI platform.

The design supports future extension without unnecessary complexity.

------------------------------------------------------------------------

# 19. Final Engineering Summary

The system demonstrates:

-   Clean modular architecture.
-   Correct database modeling.
-   Safe concurrent booking.
-   Payment reliability.
-   Idempotency.
-   Auditability.
-   Scalable reporting approach.
-   Maintainable full-stack design.
