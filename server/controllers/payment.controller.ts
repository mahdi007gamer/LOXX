import { Response } from "express";
import { PaymentService } from "../services/payment.service.ts";
import { AuthenticatedRequest } from "../middleware/auth.middleware.ts";

export class PaymentController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { type, receiptImageUrl, promoCode } = req.body;
      if (!type || !receiptImageUrl) throw new Error("MISSING_FIELDS");
      
      const payment = await PaymentService.createPaymentRequest(req.user!.userId, type, receiptImageUrl, promoCode);
      res.status(201).json({ status: "success", data: payment });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async verifyPromo(req: AuthenticatedRequest, res: Response) {
    try {
      const { code } = req.body;
      if (!code) throw new Error("MISSING_CODE");
      
      const promoData = await PaymentService.verifyPromoCode(code);
      res.json({ status: "success", data: promoData });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async status(req: AuthenticatedRequest, res: Response) {
    try {
      const payment = await PaymentService.getPaymentStatus(req.user!.userId);
      res.json({ status: "success", data: payment });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      await PaymentService.cancelPaymentRequest(req.user!.userId);
      res.json({ status: "success", message: "Payment cancelled" });
    } catch (error: any) {
      res.status(400).json({ status: "error", message: error.message });
    }
  }

  static async adminListPending(req: AuthenticatedRequest, res: Response) {
    try {
      const payments = await PaymentService.getAllPendingPayments();
      res.json({ status: "success", data: payments });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async adminListHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const payments = await PaymentService.getAllHistoryPayments();
      res.json({ status: "success", data: payments });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async adminApprove(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentId } = req.body;
      await PaymentService.approvePayment(paymentId);
      res.json({ status: "success", message: "Payment approved" });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }

  static async adminReject(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentId } = req.body;
      await PaymentService.rejectPayment(paymentId);
      res.json({ status: "success", message: "Payment rejected" });
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message });
    }
  }
}
