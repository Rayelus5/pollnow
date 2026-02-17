-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationLog_actionType_idx" ON "ModerationLog"("actionType");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Participant_createdAt_idx" ON "Participant"("createdAt");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_isReviewed_createdAt_idx" ON "Report"("isReviewed", "createdAt");

-- CreateIndex
CREATE INDEX "SupportChat_isClosed_idx" ON "SupportChat"("isClosed");

-- CreateIndex
CREATE INDEX "SupportChat_lastMessageAt_idx" ON "SupportChat"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");
