# رسالة للفرونت - مشكلة قسم Schreiben

Issue only happens in Schreiben section: it shows Attempt is already submitted even for a new student.

Please check attempt creation/fetch logic in Schreiben flow:

1. **Ensure we call `getOrCreateAttempt(userId, examId)` (not examId only)**
   - Make sure the attempt creation includes both userId and examId
   - Verify the API endpoint uses the authenticated user's ID

2. **Do not reuse cached attemptId from previous user/session**
   - Clear any cached attemptId when user changes
   - Reset attempt state when switching between users
   - Ensure attemptId is not stored in localStorage/sessionStorage in a way that persists across users

3. **Clear/replace attempt state when user changes**
   - When a new user logs in, clear all attempt-related state
   - Reset any attempt context or state management

4. **Verify the request uses the current auth token**
   - Ensure the Authorization header is sent with each attempt request
   - Check that the token is not expired or invalid
   - Verify token is refreshed if needed

**Please share the Network calls for:**
- Start/get attempt in Schreiben section
- Submit attempt in Schreiben section

This will help identify where the issue occurs in the request flow.

---

## Frontend Improvements Made

The frontend has been updated to better handle this issue:

1. **Pre-submit validation**: Added attempt status refresh before submit to ensure we have the latest status
2. **Better error handling**: Improved 403 error handling with attempt refresh and clearer user messages
3. **Status check**: Added double-check of attempt status before allowing submit

However, the root cause appears to be in the backend attempt creation/fetching logic, which needs to be fixed to prevent this issue from occurring in the first place.

---

## Additional Requirement: Unlimited Attempts for Schreiben Section

**Important:** The Schreiben (writing) section should allow unlimited attempts, even if the exam has an `attemptLimit` set.

**Current behavior:** Students can only attempt once in Schreiben section.

**Required behavior:** Students should be able to attempt Schreiben section multiple times without restriction.

**Implementation suggestion:**
- When creating an attempt for an exam that contains a Schreiben section, bypass the `attemptLimit` check
- Or set `attemptLimit: 0` (unlimited) specifically for exams/sections with Schreiben skill
- Ensure the backend allows multiple attempts for Schreiben even if the exam has `attemptLimit > 0`

