import { supabase } from "@/integrations/supabase/client";

type EmailType =
  | "welcome"
  | "verification_approved"
  | "verification_rejected"
  | "task_approved"
  | "task_rejected"
  | "coupon_generated"
  | "withdrawal_requested"
  | "withdrawal_paid"
  | "referral_joined"
  | "admin_alert";

async function sendEmail(type: EmailType, to: string, payload: Record<string, unknown> = {}) {
  try {
    await supabase.functions.invoke("send-email", {
      body: { type, to, ...payload },
    });
  } catch {
    // Fire-and-forget — never block the user flow on email failures
  }
}

/** Sent after a new user completes OTP verification */
export const sendWelcomeEmail = (to: string, name: string) =>
  sendEmail("welcome", to, { name });

/** Sent when admin approves a user's social profile */
export const sendVerificationApprovedEmail = (to: string, name: string) =>
  sendEmail("verification_approved", to, { name });

/** Sent when admin rejects a user's social profile */
export const sendVerificationRejectedEmail = (to: string, name: string, reason?: string) =>
  sendEmail("verification_rejected", to, { name, reason });

/** Sent when admin approves a task submission */
export const sendTaskApprovedEmail = (to: string, name: string, taskName: string, amount: number) =>
  sendEmail("task_approved", to, { name, task_name: taskName, amount: amount.toFixed(2) });

/** Sent when admin rejects a task submission */
export const sendTaskRejectedEmail = (to: string, name: string, taskName: string, reason?: string) =>
  sendEmail("task_rejected", to, { name, task_name: taskName, reason });

/** Sent after a user successfully generates coupon codes */
export const sendCouponGeneratedEmail = (
  to: string,
  name: string,
  productName: string,
  codes: string[],
  commission: number
) => sendEmail("coupon_generated", to, { name, product_name: productName, codes, commission: commission.toFixed(2) });

/** Sent when a user submits a withdrawal request */
export const sendWithdrawalRequestedEmail = (
  to: string,
  name: string,
  amount: number,
  method: string
) => sendEmail("withdrawal_requested", to, { name, amount: amount.toFixed(2), method });

/** Sent when admin marks a withdrawal as paid */
export const sendWithdrawalPaidEmail = (to: string, name: string, amount: number, method: string) =>
  sendEmail("withdrawal_paid", to, { name, amount: amount.toFixed(2), method });

/** Sent when someone joins DopeDeal using the user's referral code */
export const sendReferralJoinedEmail = (
  to: string,
  name: string,
  friendName: string,
  totalReferrals: number
) => sendEmail("referral_joined", to, { name, friend_name: friendName, total_referrals: totalReferrals });
