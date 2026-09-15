-- Office managers: workdesk, knowledge, operations, and enquiries except
-- career applications. Additive enum value; existing roles are unchanged.

ALTER TYPE "Role" ADD VALUE 'MANAGER';

ALTER TABLE "InternalTask" ADD COLUMN "enquiryKind" TEXT;
ALTER TABLE "InternalTask" ADD COLUMN "enquiryId" TEXT;

CREATE UNIQUE INDEX "InternalTask_enquiryKind_enquiryId_key" ON "InternalTask"("enquiryKind", "enquiryId");
