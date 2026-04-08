-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'COLLABORATION');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "defaultCanDeleteEvent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCanEditSettings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCanManageNominees" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCanManagePolls" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCanRegenerateKey" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "defaultCanViewStats" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "invitationId" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM';

-- CreateTable
CREATE TABLE "EventCollaborator" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canEditSettings" BOOLEAN,
    "canRegenerateKey" BOOLEAN,
    "canDeleteEvent" BOOLEAN,
    "canManageNominees" BOOLEAN,
    "canManagePolls" BOOLEAN,
    "canViewStats" BOOLEAN,

    CONSTRAINT "EventCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaboratorInvitation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CollaboratorInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventCollaborator_eventId_idx" ON "EventCollaborator"("eventId");

-- CreateIndex
CREATE INDEX "EventCollaborator_userId_idx" ON "EventCollaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCollaborator_eventId_userId_key" ON "EventCollaborator"("eventId", "userId");

-- CreateIndex
CREATE INDEX "CollaboratorInvitation_eventId_idx" ON "CollaboratorInvitation"("eventId");

-- CreateIndex
CREATE INDEX "CollaboratorInvitation_invitedUserId_idx" ON "CollaboratorInvitation"("invitedUserId");

-- CreateIndex
CREATE INDEX "CollaboratorInvitation_status_idx" ON "CollaboratorInvitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorInvitation_eventId_invitedUserId_key" ON "CollaboratorInvitation"("eventId", "invitedUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorInvitation" ADD CONSTRAINT "CollaboratorInvitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorInvitation" ADD CONSTRAINT "CollaboratorInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorInvitation" ADD CONSTRAINT "CollaboratorInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
