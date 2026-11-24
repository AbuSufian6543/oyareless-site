-- Dashboard reads filter tasks by status and due date, and events by time.
CREATE INDEX "InternalTask_status_dueAt_idx" ON "InternalTask"("status", "dueAt");
CREATE INDEX "InternalTask_completedAt_idx" ON "InternalTask"("completedAt");
CREATE INDEX "InternalTask_closedAt_idx" ON "InternalTask"("closedAt");
CREATE INDEX "WorkdeskEvent_createdAt_idx" ON "WorkdeskEvent"("createdAt");
