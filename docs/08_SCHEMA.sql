-- 08_SCHEMA.sql
-- Hajj & Umrah Package Booking System
-- PostgreSQL Database Schema
--
-- Design goals:
-- - Correct booking workflow
-- - Multi pilgrim support
-- - Seat reservation safety
-- - Payment integrity
-- - Auditability
-- - Simple modular monolith database design


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM (
    'USER',
    'ADMIN'
);

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'SUSPENDED'
);

CREATE TYPE package_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);

CREATE TYPE booking_status AS ENUM (
    'HELD',
    'PENDING_PAYMENT',
    'PARTIALLY_PAID',
    'CONFIRMED',
    'DEFAULTED',
    'EXPIRED',
    'CANCELLED',
    'COMPLETED'
);

CREATE TYPE payment_mode AS ENUM (
    'FULL',
    'INSTALLMENT'
);

CREATE TYPE reservation_status AS ENUM (
    'HELD',
    'CONFIRMED',
    'RELEASED'
);

CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);

CREATE TYPE installment_status AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE'
);

CREATE TYPE refund_status AS ENUM (
    'REQUESTED',
    'APPROVED',
    'PROCESSING',
    'COMPLETED',
    'REJECTED'
);

CREATE TYPE reconciliation_status AS ENUM (
    'MATCHED',
    'MISMATCH',
    'UNDER_REVIEW',
    'RESOLVED'
);

CREATE TYPE inventory_transaction_type AS ENUM (
    'PURCHASE',
    'ISSUE',
    'RETURN',
    'ADJUSTMENT'
);


-- =====================================================
-- USERS
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),

    password_hash TEXT NOT NULL,

    role user_role NOT NULL DEFAULT 'USER',
    status user_status NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- PACKAGE MANAGEMENT
-- =====================================================

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(200) NOT NULL,

    type VARCHAR(50) NOT NULL,

    description TEXT,

    departure_date DATE NOT NULL,

    booking_start_date DATE NOT NULL,
    booking_end_date DATE NOT NULL,

    status package_status NOT NULL DEFAULT 'DRAFT',

    version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE package_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    package_id UUID NOT NULL
        REFERENCES packages(id),

    name VARCHAR(50) NOT NULL,

    price INTEGER NOT NULL
        CHECK(price > 0),

    quota INTEGER NOT NULL
        CHECK(quota > 0),

    held_seats INTEGER NOT NULL DEFAULT 0
        CHECK(held_seats >= 0),

    confirmed_seats INTEGER NOT NULL DEFAULT 0
        CHECK(confirmed_seats >= 0),

    version INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_seat_count
    CHECK(
        held_seats + confirmed_seats <= quota
    )
);


-- =====================================================
-- BOOKINGS
-- =====================================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL
        REFERENCES users(id),

    package_id UUID NOT NULL
        REFERENCES packages(id),

    tier_id UUID NOT NULL
        REFERENCES package_tiers(id),

    status booking_status NOT NULL,

    payment_mode payment_mode NOT NULL,

    tier_name_snapshot VARCHAR(100) NOT NULL,

    unit_price_snapshot INTEGER NOT NULL,

    total_amount INTEGER NOT NULL,

    expires_at TIMESTAMP,

    version INTEGER NOT NULL DEFAULT 1,

    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE booking_pilgrims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    full_name VARCHAR(150) NOT NULL,

    passport_number VARCHAR(100) NOT NULL,

    nationality VARCHAR(100),

    date_of_birth DATE,

    passport_expiry DATE,

    status VARCHAR(30) DEFAULT 'ACTIVE'
);


CREATE TABLE seat_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    tier_id UUID NOT NULL
        REFERENCES package_tiers(id),

    quantity INTEGER NOT NULL
        CHECK(quantity > 0),

    status reservation_status NOT NULL,

    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- INSTALLMENT MODULE
-- =====================================================

CREATE TABLE installment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,

    description TEXT
);


CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    sequence INTEGER NOT NULL,

    amount_due INTEGER NOT NULL
        CHECK(amount_due > 0),

    amount_paid INTEGER NOT NULL DEFAULT 0
        CHECK(amount_paid >= 0),

    due_date DATE NOT NULL,

    grace_end_date DATE,

    status installment_status NOT NULL DEFAULT 'PENDING'
);


-- =====================================================
-- PAYMENT MODULE
-- =====================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    provider VARCHAR(50) NOT NULL,

    method VARCHAR(50) NOT NULL,

    amount INTEGER NOT NULL
        CHECK(amount > 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',

    gateway_transaction_id VARCHAR(255),

    status payment_status NOT NULL DEFAULT 'PENDING',

    created_by UUID
        REFERENCES users(id),

    approved_by UUID
        REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX unique_gateway_transaction
ON payments(provider, gateway_transaction_id);


CREATE TABLE payment_gateway_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    provider VARCHAR(50) NOT NULL,

    event_id VARCHAR(255) NOT NULL,

    transaction_id VARCHAR(255),

    event_type VARCHAR(50) NOT NULL,

    payload JSONB,

    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE UNIQUE INDEX unique_payment_event
ON payment_gateway_events(provider, event_id);


CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    payment_id UUID NOT NULL
        REFERENCES payments(id),

    installment_id UUID NOT NULL
        REFERENCES installments(id),

    allocated_amount INTEGER NOT NULL
        CHECK(allocated_amount > 0)
);


-- =====================================================
-- MANUAL PAYMENT
-- =====================================================

CREATE TABLE manual_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    amount INTEGER NOT NULL,

    recorded_by UUID NOT NULL
        REFERENCES users(id),

    approved_by UUID
        REFERENCES users(id),

    status VARCHAR(30) DEFAULT 'REQUESTED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- CANCELLATION
-- =====================================================

CREATE TABLE cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    reason TEXT,

    cancellation_fee INTEGER DEFAULT 0,

    status VARCHAR(30) DEFAULT 'REQUESTED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE cancellation_pilgrims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    cancellation_id UUID NOT NULL
        REFERENCES cancellations(id),

    pilgrim_id UUID NOT NULL
        REFERENCES booking_pilgrims(id)
);


-- =====================================================
-- REFUNDS
-- =====================================================

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    booking_id UUID NOT NULL
        REFERENCES bookings(id),

    amount INTEGER NOT NULL,

    status refund_status NOT NULL DEFAULT 'REQUESTED',

    approved_by UUID
        REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- RECONCILIATION
-- =====================================================

CREATE TABLE reconciliation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    payment_id UUID NOT NULL
        REFERENCES payments(id),

    internal_amount INTEGER NOT NULL,

    gateway_amount INTEGER NOT NULL,

    difference INTEGER NOT NULL,

    status reconciliation_status NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- VENDOR EXPENSES
-- =====================================================

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(150) NOT NULL,

    currency VARCHAR(10)
);


CREATE TABLE vendor_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    vendor_id UUID NOT NULL
        REFERENCES vendors(id),

    booking_id UUID
        REFERENCES bookings(id),

    amount INTEGER NOT NULL,

    currency VARCHAR(10) NOT NULL,

    exchange_rate NUMERIC(10,2),

    amount_bdt INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 0
);


CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    item_id UUID NOT NULL
        REFERENCES inventory_items(id),

    booking_id UUID
        REFERENCES bookings(id),

    type inventory_transaction_type NOT NULL,

    quantity INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    actor_id UUID
        REFERENCES users(id),

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id UUID,

    old_value JSONB,

    new_value JSONB,

    ip_address VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- IDEMPOTENCY
-- =====================================================

CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID
        REFERENCES users(id),

    endpoint VARCHAR(255) NOT NULL,

    idempotency_key VARCHAR(255) NOT NULL,

    request_hash VARCHAR(255),

    response_data JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(endpoint, idempotency_key)
);


-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_packages_status
ON packages(status);


CREATE INDEX idx_packages_departure_date
ON packages(departure_date);


CREATE INDEX idx_booking_user
ON bookings(user_id);


CREATE INDEX idx_booking_status
ON bookings(status);


CREATE INDEX idx_payment_booking
ON payments(booking_id);


CREATE INDEX idx_installment_booking
ON installments(booking_id);


CREATE INDEX idx_audit_entity
ON audit_logs(entity_type, entity_id);


-- =====================================================
-- IMPORTANT IMPLEMENTATION NOTES
-- =====================================================

-- Seat overselling prevention:
-- Use transaction + SELECT FOR UPDATE on package_tiers.

-- Price freezing:
-- bookings stores snapshot values.

-- Payment idempotency:
-- provider + gateway_transaction_id must be unique.

-- Financial records:
-- Use soft delete. Never hard delete payments/bookings.

-- Installment allocation:
-- Payments are applied oldest unpaid installment first.
