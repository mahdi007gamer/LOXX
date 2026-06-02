import fs from "fs";
let code = fs.readFileSync("server/controllers/report.controller.ts", "utf8");

// Add myTickets endpoint
code = code.replace(
  "static async create(req: AuthenticatedRequest, res: Response) {",
  `static async myTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const tickets = await prisma.report.findMany({
        where: { reporterId: req.user!.userId, targetType: 'TICKET' },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ status: "success", data: tickets });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: { message: err.message } });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {`
);

// Modify create validation
code = code.replace(
  `const existing = await prisma.report.findFirst({
        where: { reporterId, targetId, targetType, status: "PENDING" }
      });`,
  `const existing = await prisma.report.findFirst({
        where: targetType === 'TICKET' 
          ? { reporterId, targetType: "TICKET", status: "PENDING" }
          : { reporterId, targetId, targetType, status: "PENDING" }
      });`
);

// Add admin action logic for TICKET
const modifyApplyAction = `if (action === 'RESPOND_TICKET') {
        const { adminResponse } = req.body;
        await prisma.report.update({
          where: { id: reportId },
          data: { status: "ACTIONED", adminResponse }
        });
        
        // Notify user about ticket response
        if (report.reporterId) {
           await prisma.notification.create({
             data: {
               userId: report.reporterId,
               type: "SYSTEM_MSG",
               data: JSON.stringify({ message: "پاسخ جدید برای تیکت/گزارش شما ارسال شد." }),
               isRead: false
             }
           });
        }
        return res.json({ status: "success", message: "Response saved" });
      }
      
      if (action === 'REJECT_TICKET') {
        await prisma.report.update({
           where: { id: reportId },
           data: { status: "REJECTED", adminResponse: req.body.adminResponse || null }
        });
        return res.json({ status: "success", message: "Ticket rejected" });
      }

      await prisma.report.update({`;
      
code = code.replace("await prisma.report.update({", modifyApplyAction);

fs.writeFileSync("server/controllers/report.controller.ts", code);
console.log("Fixed report.controller.ts");
