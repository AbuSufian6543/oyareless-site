-- Staff who can create, update, and delete tickets and tasks, and read those
-- audit trails, without CMS or site-configuration access.

ALTER TYPE "Role" ADD VALUE 'EMPLOYEE';
