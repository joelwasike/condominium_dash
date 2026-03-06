# Fix: Duplicate Route `/api/agency-director/accounting/expenses/pending-approval`

## Problem
```
panic: handlers are already registered for path '/api/agency-director/accounting/expenses/pending-approval'
```

## Solution
On your server, run:

```bash
cd /root/real-estate-backend
grep -n "expenses/pending-approval\|pending-approval" internal/roles/agencydirector/routes.go
```

This will show all lines registering that route. **Remove the duplicate** – keep only ONE registration.

## Typical causes
1. **Same route registered twice** in `Register()` – delete one of the duplicate lines
2. **Route registered in both** a parent group and agency group – remove from one
3. **Copy-paste** left an extra registration

## What to look for
In `internal/roles/agencydirector/routes.go`, you'll see something like:
```go
agencyGroup.GET("accounting/expenses/pending-approval", handler)
```

If this line appears **twice** (or the path is registered via a nested group that also adds it), remove one.

## After fixing
```bash
go run ./cmd/server
```
