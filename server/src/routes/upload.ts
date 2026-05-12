import { Router } from "express";
import { prisma } from "../lib/prisma";

export const uploadRouter = Router();

uploadRouter.post("/", async (req, res) => {
  try {
    const { slotId, records, fileName, userId, schoolId } = req.body;

    if (!slotId || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid payload format" });
    }

    let updatedCount = 0;

    // We process the records and update the database accordingly
    for (const record of records) {
      if (!record.CHILDSNO) continue;
      const childSno = parseInt(record.CHILDSNO);
      if (isNaN(childSno)) continue;

      if (slotId === "attendance") {
        if (record.attendanceRate) {
          const rate = parseFloat(record.attendanceRate);
          if (!isNaN(rate)) {
            // Update StudentDetail
            await prisma.studentDetail.updateMany({
              where: { childSno },
              data: { attendanceRate: rate }
            });
            // Update RosterStudent
            await prisma.rosterStudent.updateMany({
              where: { childSno },
              data: { attendanceRate: rate }
            });
            updatedCount++;
          }
        }
      } else if (slotId === "marks") {
        const dataToUpdate: any = {};
        if (record.faAvg) {
          const fa = parseFloat(record.faAvg);
          if (!isNaN(fa)) dataToUpdate.faAvg = fa;
        }
        if (record.saAvg) {
          const sa = parseFloat(record.saAvg);
          if (!isNaN(sa)) dataToUpdate.saAvg = sa;
        }
        if (Object.keys(dataToUpdate).length > 0) {
          await prisma.studentDetail.updateMany({
            where: { childSno },
            data: dataToUpdate
          });

          if (dataToUpdate.faAvg) {
             await prisma.rosterStudent.updateMany({
               where: { childSno },
               data: { faAvg: dataToUpdate.faAvg }
             });
          }
          updatedCount++;
        }
      } else if (slotId === "dropout") {
        // Here we could handle dropout reasons.
        // For simplicity, we just count it as processed if it has a reason.
        if (record.reason) {
          // Perhaps add an intervention or update student status
          // Note: In schema there is no direct dropout reason field except in Driver model
          // or Intervention. We'll just count it for now.
          updatedCount++;
        }
      }
    }

    // Record the upload
    await prisma.dataUpload.create({
      data: {
        slotId,
        fileName: fileName || slotId,
        recordCount: records.length,
        uploadedBy: userId ? parseInt(userId) : null,
        schoolId: schoolId ? BigInt(schoolId) : null,
      }
    });

    res.json({ success: true, updatedCount });
  } catch (error) {
    console.error("Error processing upload:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process upload data" });
  }
});

uploadRouter.get("/recent", async (req, res) => {
  try {
    const { slotId, schoolId, limit = "10" } = req.query;
    const take = parseInt(limit as string) || 10;

    const where: any = {};
    if (slotId) where.slotId = slotId;
    if (schoolId) where.schoolId = BigInt(schoolId as string);

    const uploads = await prisma.dataUpload.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { name: true } } }
    });

    res.json({ uploads });
  } catch (error) {
    console.error("Error fetching recent uploads:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to fetch recent uploads" });
  }
});
