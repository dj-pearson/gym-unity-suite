# Testing Guide - Navigation & Functionality Fixes

## Test Suite Overview

This document provides step-by-step testing procedures for the three critical areas:
1. Multi-tenant isolation verification
2. Equipment page stats validation
3. Member creation workflow testing

---

## Test 1: Multi-Tenant Isolation

### Objective
Verify that the security fixes prevent data leaks between different organizations.

### Prerequisites
- Two separate organizations in the database
- Test users with different organization_ids
- Access to Supabase database or Studio

### Test Cases

#### 1.1 Announcements Isolation
**File:** `src/components/communication/PlaceholderComponents.tsx:50-67`

**Steps:**
1. Login as User A (Organization 1)
2. Navigate to `/communication`
3. Create a test announcement: "Test Announcement Org 1"
4. Note the announcement ID
5. Logout
6. Login as User B (Organization 2)
7. Navigate to `/communication`
8. Verify announcements list

**Expected Result:**
- ✅ User B should NOT see "Test Announcement Org 1"
- ✅ User B should only see announcements for Organization 2

**SQL Verification:**
```sql
-- Check that query includes organization_id filter
SELECT * FROM announcements
WHERE organization_id = '<user_org_id>'
ORDER BY created_at DESC;
```

#### 1.2 Email Templates Isolation
**File:** `src/components/communication/PlaceholderComponents.tsx:308-325`

**Steps:**
1. Login as User A (Organization 1)
2. Navigate to `/communication` > Email Templates tab
3. Create a test template: "Welcome Email Org 1"
4. Note the template ID
5. Logout
6. Login as User B (Organization 2)
7. Navigate to `/communication` > Email Templates tab
8. Verify templates list

**Expected Result:**
- ✅ User B should NOT see "Welcome Email Org 1"
- ✅ User B should only see templates for Organization 2

**SQL Verification:**
```sql
SELECT * FROM email_templates
WHERE organization_id = '<user_org_id>'
ORDER BY created_at DESC;
```

#### 1.3 Class Waitlist Isolation
**File:** `src/pages/ClassesPage.tsx:149-168`

**Steps:**
1. Login as User A (Organization 1)
2. Navigate to `/classes`
3. Create a test class: "Yoga Class Org 1"
4. Add members to waitlist
5. Logout
6. Login as User B (Organization 2)
7. Navigate to `/classes`
8. Open browser DevTools > Network tab
9. Refresh the page
10. Examine the `class_waitlists` query

**Expected Result:**
- ✅ Query should use `.in('class_id', [org1_class_ids])`
- ✅ User B should NOT see waitlist entries from Organization 1
- ✅ Response should only contain waitlist data for Organization 2 classes

**SQL Verification:**
```sql
-- Verify the query filters by class_id
SELECT cw.* FROM class_waitlists cw
INNER JOIN classes c ON c.id = cw.class_id
WHERE c.organization_id = '<user_org_id>'
AND cw.status = 'waiting';
```

#### 1.4 CRM Activities Isolation
**File:** `src/pages/CRMPage.tsx:130-152`

**Steps:**
1. Login as User A (Organization 1)
2. Navigate to `/crm`
3. Create a test lead: "John Doe Org 1"
4. Add activity: "Called prospect"
5. Logout
6. Login as User B (Organization 2)
7. Navigate to `/crm`
8. Open browser DevTools > Network tab
9. Check the `lead_activities` query

**Expected Result:**
- ✅ Query should use JOIN with `leads!inner(organization_id)`
- ✅ User B should NOT see activity "Called prospect" for John Doe
- ✅ Response should only contain activities for Organization 2 leads

**SQL Verification:**
```sql
SELECT la.* FROM lead_activities la
INNER JOIN leads l ON l.id = la.lead_id
WHERE l.organization_id = '<user_org_id>'
ORDER BY la.created_at DESC
LIMIT 20;
```

### Test 1 Success Criteria
- [ ] All 4 sub-tests pass
- [ ] No cross-organization data visible
- [ ] Network requests show proper filtering
- [ ] SQL queries confirm organization_id filters

---

## Test 2: Equipment Page Stats Validation

### Objective
Verify that Equipment page displays real data from the database instead of hardcoded values.

### Prerequisites
- Access to organization with equipment data
- Test data in equipment-related tables

### Test Cases

#### 2.1 Total Equipment Count
**File:** `src/pages/EquipmentPage.tsx:60-63`

**Steps:**
1. Login to application
2. Navigate to `/equipment`
3. Note the "Total Equipment" value
4. Open Supabase Studio or run SQL query

**SQL Verification:**
```sql
SELECT COUNT(*) as total_equipment
FROM equipment
WHERE organization_id = '<your_org_id>';
```

**Expected Result:**
- ✅ Equipment page count matches SQL query result
- ✅ No hardcoded "127" value displayed

#### 2.2 Equipment Growth (Last 30 Days)
**File:** `src/pages/EquipmentPage.tsx:66-73`

**Steps:**
1. Check "Total Equipment" card
2. Note the "+X this month" value
3. Run SQL query to verify

**SQL Verification:**
```sql
SELECT COUNT(*) as recent_equipment
FROM equipment
WHERE organization_id = '<your_org_id>'
AND created_at >= NOW() - INTERVAL '30 days';
```

**Expected Result:**
- ✅ Growth count matches SQL query result
- ✅ Shows "Loading..." during fetch
- ✅ Updates to real count after load

#### 2.3 Maintenance Due
**File:** `src/pages/EquipmentPage.tsx:76-87`

**Steps:**
1. Check "Maintenance Due" card
2. Note the count value
3. Check "Next: [Date]" text
4. Run SQL query to verify

**SQL Verification:**
```sql
SELECT COUNT(*) as maintenance_due
FROM maintenance_schedules ms
INNER JOIN equipment e ON e.id = ms.equipment_id
WHERE e.organization_id = '<your_org_id>'
AND ms.status = 'scheduled'
AND ms.scheduled_date >= NOW()
AND ms.scheduled_date <= NOW() + INTERVAL '7 days';
```

**Expected Result:**
- ✅ Count matches SQL result
- ✅ "Next:" shows "Today", "Tomorrow", or specific date
- ✅ No hardcoded "8" or "Tomorrow" values

#### 2.4 Facility Areas Count
**File:** `src/pages/EquipmentPage.tsx:107-110`

**Steps:**
1. Check "Facility Areas" card
2. Note the count value
3. Run SQL query

**SQL Verification:**
```sql
SELECT COUNT(*) as facility_areas
FROM facility_areas
WHERE organization_id = '<your_org_id>';
```

**Expected Result:**
- ✅ Count matches SQL result
- ✅ No hardcoded "12" value

#### 2.5 Open Incidents
**File:** `src/pages/EquipmentPage.tsx:113-122`

**Steps:**
1. Check "Open Incidents" card
2. Note the count and "X high priority" text
3. Note the badge color (red for high priority, green otherwise)
4. Run SQL query

**SQL Verification:**
```sql
SELECT
  COUNT(*) as total_open,
  SUM(CASE WHEN priority IN ('high', 'critical') THEN 1 ELSE 0 END) as high_priority
FROM incident_reports
WHERE organization_id = '<your_org_id>'
AND status IN ('open', 'in_progress');
```

**Expected Result:**
- ✅ Total count matches SQL `total_open`
- ✅ High priority count matches SQL `high_priority`
- ✅ Badge is red if high_priority > 0, green otherwise
- ✅ No hardcoded "2" or "1 high priority" values

#### 2.6 Loading States
**Steps:**
1. Clear browser cache
2. Navigate to `/equipment`
3. Observe the stats cards during load

**Expected Result:**
- ✅ All cards show "-" during loading
- ✅ All cards show "Loading..." for change text
- ✅ Smooth transition to real data

### Test 2 Success Criteria
- [ ] All 6 stats display real database values
- [ ] No hardcoded values visible
- [ ] Loading states work correctly
- [ ] SQL verification confirms accuracy
- [ ] Color coding works (red/green for incidents)

---

## Test 3: Member Creation Workflow

### Objective
Verify end-to-end member creation using the new AddMemberDialog component.

### Prerequisites
- Access to test organization
- Supabase credentials with member creation permissions

### Test Cases

#### 3.1 Open Add Member Dialog
**File:** `src/pages/MembersPage.tsx:124-130`

**Steps:**
1. Login to application
2. Navigate to `/members`
3. Click "Add Member" button in header

**Expected Result:**
- ✅ AddMemberDialog opens
- ✅ Form displays with 4 fields: Email, First Name, Last Name, Phone
- ✅ Email and names marked as required (*)

#### 3.2 Form Validation
**File:** `src/components/members/AddMemberDialog.tsx:23-49`

**Steps:**
1. Open Add Member Dialog
2. Click "Add Member" button without filling fields
3. Observe validation messages

**Expected Result:**
- ✅ Email field shows "Required" error
- ✅ First Name shows "Required" error
- ✅ Last Name shows "Required" error
- ✅ Phone is optional (no error)
- ✅ Cannot submit with empty required fields

#### 3.3 Create New Member (Happy Path)
**File:** `src/components/members/AddMemberDialog.tsx:51-86`

**Steps:**
1. Open Add Member Dialog
2. Fill in the form:
   - Email: `test.member@example.com`
   - First Name: `Test`
   - Last Name: `Member`
   - Phone: `555-1234`
3. Click "Add Member" button
4. Wait for submission

**Expected Result:**
- ✅ Button shows loading spinner during submission
- ✅ Success toast appears: "Member added successfully"
- ✅ Toast message includes member name: "Test Member has been added"
- ✅ Dialog closes automatically
- ✅ Members list refreshes with new member
- ✅ New member appears at top of list

**SQL Verification:**
```sql
-- Check user was created in auth.users
SELECT id, email FROM auth.users
WHERE email = 'test.member@example.com';

-- Check profile was created
SELECT * FROM profiles
WHERE email = 'test.member@example.com'
AND organization_id = '<your_org_id>'
AND role = 'member';
```

#### 3.4 Organization Assignment
**File:** `src/components/members/AddMemberDialog.tsx:58-70`

**Steps:**
1. After creating member in 3.3
2. Query the database
3. Verify organization_id

**SQL Verification:**
```sql
SELECT
  p.id,
  p.email,
  p.organization_id,
  p.role,
  o.name as org_name
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.email = 'test.member@example.com';
```

**Expected Result:**
- ✅ Profile has correct organization_id
- ✅ Organization name matches logged-in user's org
- ✅ Role is set to 'member'

#### 3.5 Error Handling (Duplicate Email)
**Steps:**
1. Create a member with email: `duplicate@example.com`
2. Try to create another member with same email
3. Observe error handling

**Expected Result:**
- ✅ Error toast appears
- ✅ Error message is user-friendly
- ✅ Dialog remains open
- ✅ Form data is preserved
- ✅ User can correct and retry

#### 3.6 Add Member from Empty State
**File:** `src/pages/MembersPage.tsx:197-203`

**Steps:**
1. Ensure members list is empty (or search for non-existent member)
2. Click "Add First Member" button in empty state

**Expected Result:**
- ✅ AddMemberDialog opens
- ✅ Same functionality as header "Add Member" button

#### 3.7 List Refresh After Creation
**File:** `src/pages/MembersPage.tsx:38-40`

**Steps:**
1. Note current members count
2. Add a new member
3. Observe members list

**Expected Result:**
- ✅ Members list automatically refreshes
- ✅ New member appears immediately
- ✅ Stats cards update (Total Members count increases)
- ✅ No page reload required

#### 3.8 Cancel Dialog
**Steps:**
1. Open Add Member Dialog
2. Fill in some fields
3. Click "Cancel" button

**Expected Result:**
- ✅ Dialog closes
- ✅ Form data is cleared
- ✅ No member is created
- ✅ Members list unchanged

### Test 3 Success Criteria
- [ ] All 8 sub-tests pass
- [ ] Member creation works end-to-end
- [ ] Form validation prevents bad data
- [ ] Success/error handling works correctly
- [ ] Organization assignment is accurate
- [ ] List updates automatically

---

## Automated Test Script

For automated verification, run this SQL script in Supabase Studio:

```sql
-- Multi-Tenant Isolation Test
-- Run this as different users to verify data isolation

-- 1. Check announcements are filtered by org
EXPLAIN ANALYZE
SELECT * FROM announcements
WHERE organization_id = auth.jwt() ->> 'organization_id'
ORDER BY created_at DESC;

-- 2. Check email templates are filtered by org
EXPLAIN ANALYZE
SELECT * FROM email_templates
WHERE organization_id = auth.jwt() ->> 'organization_id'
ORDER BY created_at DESC;

-- 3. Check class waitlists use proper join
EXPLAIN ANALYZE
SELECT cw.* FROM class_waitlists cw
INNER JOIN classes c ON c.id = cw.class_id
WHERE c.organization_id = auth.jwt() ->> 'organization_id'
AND cw.status = 'waiting';

-- 4. Check CRM activities use join
EXPLAIN ANALYZE
SELECT la.* FROM lead_activities la
INNER JOIN leads l ON l.id = la.lead_id
WHERE l.organization_id = auth.jwt() ->> 'organization_id'
ORDER BY la.created_at DESC
LIMIT 20;

-- Equipment Stats Verification
-- Replace <your_org_id> with actual ID

-- Total equipment
SELECT COUNT(*) FROM equipment WHERE organization_id = '<your_org_id>';

-- Equipment growth (30 days)
SELECT COUNT(*) FROM equipment
WHERE organization_id = '<your_org_id>'
AND created_at >= NOW() - INTERVAL '30 days';

-- Maintenance due (7 days)
SELECT COUNT(*) FROM maintenance_schedules ms
INNER JOIN equipment e ON e.id = ms.equipment_id
WHERE e.organization_id = '<your_org_id>'
AND ms.status = 'scheduled'
AND ms.scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Facility areas
SELECT COUNT(*) FROM facility_areas WHERE organization_id = '<your_org_id>';

-- Open incidents
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN priority IN ('high', 'critical') THEN 1 ELSE 0 END) as high_priority
FROM incident_reports
WHERE organization_id = '<your_org_id>'
AND status IN ('open', 'in_progress');
```

---

## Test Execution Checklist

### Pre-Testing
- [ ] Database has test data for both organizations
- [ ] Test users created for Org 1 and Org 2
- [ ] Browser DevTools ready for network inspection
- [ ] Supabase Studio open for SQL verification

### During Testing
- [ ] Document all findings
- [ ] Screenshot any issues
- [ ] Record network requests
- [ ] Note performance metrics

### Post-Testing
- [ ] All tests passed
- [ ] Issues documented and reported
- [ ] Test data cleaned up
- [ ] Results shared with team

---

## Expected Outcomes

✅ **Test 1 Pass:** No cross-organization data leaks
✅ **Test 2 Pass:** All stats show real, accurate data
✅ **Test 3 Pass:** Member creation works flawlessly

If any test fails, refer to the specific file locations and line numbers provided in each test case.

---

## Contact & Support

For issues or questions about these tests:
- Check the implementation files listed in each test
- Review commit: `b629707` (Security fixes)
- Review commit: `08c00cd` (Equipment stats)
