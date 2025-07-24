-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "operatorId" TEXT,
    "content" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "status" TEXT,
    "reason" TEXT,
    "jobType" TEXT,
    "urgency" INTEGER,
    "channel" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
