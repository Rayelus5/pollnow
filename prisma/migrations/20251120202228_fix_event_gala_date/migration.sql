/*
  Warnings:

  - Made the column `galaDate` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "galaDate" SET NOT NULL,
ALTER COLUMN "galaDate" SET DEFAULT CURRENT_TIMESTAMP;
