# 05_USER_FRONTEND_AGENT_GUIDE.md
# Hajj & Umrah Package Booking System
# User Frontend Antigravity Implementation Guide

## Purpose

This document guides the AI agent to implement the pilgrim/user-facing frontend.

Technology:

- Next.js
- TypeScript
- Modern component-based architecture

The frontend goal is:

- Simple booking experience
- Clear user journey
- Correct interaction with backend rules
- Proper error handling

The frontend must not contain business rules that belong to the backend.

---

# General Agent Rules

Before coding:

1. Inspect existing project structure.
2. Follow API specification.
3. Reuse existing components.
4. Do not duplicate backend logic.

Always:

- Validate user input.
- Handle loading states.
- Handle API failures.
- Protect private pages.
- Keep UI responsive.

Do not:

- Calculate payment success on frontend.
- Decide seat availability locally.
- Modify booking status manually.
- Store sensitive information insecurely.

---

# Frontend Structure

Suggested structure:

```
app/

(auth)
 ├── login
 └── register

(packages)
 ├── page
 └── [id]

(bookings)
 ├── create
 ├── history
 └── [id]

(profile)

(admin)
```

Components:

```
components/

PackageCard
TierCard
PilgrimForm
BookingSummary
PaymentStatus
ErrorMessage
LoadingState
```

---

# C01 — Frontend Foundation

## Goal

Create Next.js application foundation.

## Implement

Setup:

- Next.js
- TypeScript
- Routing
- API client
- Environment configuration


Create:

- Global layout
- Error handling
- Loading components
- Reusable UI components


## Checkpoint

Verify:

- Application starts.
- API communication works.
- Routing works.

---

# C02 — Authentication Pages

## Goal

Implement user authentication.

## Create

## Register Page

Fields:

- Name
- Email
- Password


## Login Page

Fields:

- Email
- Password


## Requirements

Implement:

- Form validation
- API integration
- Authentication state
- Redirect after login


## Rules

Never allow:

```
role=ADMIN
```

from frontend registration.


## Checkpoint

User can:

- Register
- Login
- Logout

---

# C03 — User Session Management

## Goal

Manage authenticated user experience.

## Implement

- Auth provider/store
- Protected routes
- Current user loading


Private pages:

- My bookings
- Booking details
- Profile


If unauthenticated:

Redirect to login.


## Checkpoint

Protected routes work correctly.

---

# C04 — Package Browsing

## Goal

Allow users to discover packages.

## Create

Package listing page.

Show:

- Package name
- Package type
- Departure date
- Booking status


Filters:

- Package type
- Date


---

## Package Details Page

Show:

- Description
- Departure date
- Booking window
- Available tiers


Tier card:

Show:

- Tier name
- Price
- Available seats


## Important

Seat availability is informational only.

Final availability is checked by backend during booking.

---

# C05 — Booking Creation Flow

## Goal

Create complete pilgrim booking journey.

Flow:

```
Select Package
        |
Select Tier
        |
Add Pilgrims
        |
Select Payment Mode
        |
Review Booking
        |
Submit
```


---

# Step 1 — Select Tier

User chooses:

- Economy
- Standard
- VIP


Display:

- Price
- Seat information


---

# Step 2 — Add Pilgrims

Support multiple pilgrims.

Fields:

- Full name
- Passport number
- Nationality
- Date of birth


Allow:

Add pilgrim

Remove pilgrim


Validation:

- Required fields
- Valid format


---

# Step 3 — Payment Choice

Options:

- Full payment
- Installment payment


Show:

- Total amount
- Payment schedule if installment selected


---

# Step 4 — Confirm Booking

Before submit show:

- Package
- Tier
- Pilgrims
- Price
- Payment mode


Submit request with:

```
Idempotency-Key
```


Reason:

Prevent duplicate booking from retries or double clicks.


---

# Error Handling

Handle:

## Seat unavailable

Example:

Another user booked the final seat.

Show:

"Selected seats are no longer available."


## Duplicate request

Reuse previous booking response.


## Validation error

Show field-level messages.


---

# C06 — Booking History

## Goal

Allow users to view their bookings.

## Create

My Bookings page.

Show:

- Package
- Tier
- Number of pilgrims
- Total amount
- Status


Statuses:

- Held
- Pending Payment
- Partially Paid
- Confirmed
- Expired
- Cancelled
- Defaulted


---

# C07 — Booking Details

## Goal

Display complete booking information.

Show:

## Package

- Name
- Tier
- Departure date


## Pilgrims

- Name
- Passport information


## Payment

- Paid amount
- Remaining amount
- Payment status


## Installments

Show:

- Amount due
- Amount paid
- Due date
- Status


---

# C08 — Payment Experience

## Goal

Display payment workflow.

Important rule:

Frontend never confirms payment success.

Wrong:

```
Payment page returned = success
```


Correct:

```
Gateway
 |
Backend verification
 |
Frontend refreshes status
```


Implement:

- Payment status polling/refresh
- Payment result page


---

# C09 — Cancellation Flow

## Goal

Allow users to request cancellation.

Create:

Cancellation request form.


Input:

- Reason


Show:

- Booking information
- Cancellation status


Statuses:

- Requested
- Approved
- Rejected
- Completed


---

# C10 — User Experience Quality

Improve:

## Loading

Every API request should have:

- Loading indicator
- Disabled submit button


## Errors

Provide:

- Clear messages
- Retry option


## Empty States

Examples:

No bookings found.


## Responsive Design

Support:

- Desktop
- Tablet
- Mobile

---

# C11 — Security Requirements

Frontend must:

- Avoid storing sensitive data unnecessarily.
- Protect private routes.
- Handle expired sessions.
- Never expose admin features to normal users.


Remember:

Frontend security is not authorization.

Backend remains the final authority.

---

# C12 — Testing

Test:

## Authentication

- Register
- Login
- Logout


## Booking

- Add multiple pilgrims
- Submit booking
- Duplicate submission


## Errors

- Seat unavailable
- Invalid data
- Unauthorized access


## Final Checkpoint

A new user should be able to:

1. Register.
2. Browse packages.
3. Select tier.
4. Add pilgrims.
5. Choose payment.
6. Create booking.
7. View booking status.

