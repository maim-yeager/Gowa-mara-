# Security Specification: Gowa Mara

## 1. Data Invariants
- Identity Integrity: A user can only create or edit their own profile, likes, comments, and messages.
- Publishing Authorization: Only users whose document in `/users/{uid}` has `status == 'approved'` can create posts.
- Role Escalation Defense: Normal users cannot set their own role to 'admin', nor can they alter their own status from 'pending' to 'approved'.
- Chat Security: Only participants of a chat (`request.auth.uid in resource.data.participantIds`) can read or write messages in `/chats/{chatId}` and `/chats/{chatId}/messages/{messageId}`.
- Sharing Invariant: Private posts cannot be read by the general public.
- Admin Protection: Only administrators registered in `/admins/{adminId}` or with verified admin email can access administrative logs, approval actions, settings, or announcements.

## 2. The "Dirty Dozen" Threat Payloads
1. **Self-Promotion to Admin**: A user creates a user document with `role: "admin"` or updates their own document with `role: "admin"`.
2. **Pending User Post Creation**: A user with `status: "pending"` attempts to create a document in `/posts`.
3. **Ghost Owner Post Injection**: A user tries to create a post with `ownerId: "other_user_id"`.
4. **Chat Infiltration**: A non-participant tries to read or post messages to `/chats/{chatId}/messages`.
5. **Like Forgery**: A user tries to create a like for another user `userId: "victim_id"`.
6. **Comment Impersonation**: A user writes a comment setting `authorId: "someone_else"`.
7. **Report Tampering**: A normal user attempts to change `status: "resolved"` or write `adminNotes` on a report.
8. **Settings Hijacking**: An unauthenticated user or normal user tries to update `/settings/app_config`.
9. **Announcement Forgery**: A normal user tries to publish an announcement.
10. **Audit Log Erasure**: A user or attacker attempts to delete or overwrite `/adminLogs/{logId}`.
11. **Malicious Giant ID**: An attacker sends a 10KB string as an ID (prevented by `isValidId()`).
12. **Notification Poisoning**: A user tries to mark notifications belonging to another user as read.

## 3. Test Coverage Strategy
All 12 attacks are blocked deterministically by strict rules validation, `isAdmin()`, `isValidId()`, `hasOnly()`, and ABAC status checks.
