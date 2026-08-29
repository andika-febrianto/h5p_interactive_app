import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyXenditCallbackToken } from '../lib/xendit.js';

export const webhooksRouter = Router();

const SUBSCRIPTION_PERIOD_DAYS = 30;

interface XenditInvoiceCallback {
  id?: string;
  external_id?: string;
  status?: string; // 'PAID' | 'EXPIRED' | 'PENDING' | ...
  paid_at?: string;
}

// POST /api/webhooks/xendit — called by Xendit itself, not by our frontend.
// Not behind requireAuth (Xendit doesn't have one of our JWTs) — instead
// verified via the x-callback-token header. Always responds quickly with a
// 2xx for anything we can't/shouldn't act on, since Xendit retries non-2xx
// responses up to 6 times with backoff.
webhooksRouter.post('/xendit', async (req, res, next) => {
  try {
    const token = req.headers['x-callback-token'];
    if (!verifyXenditCallbackToken(typeof token === 'string' ? token : undefined)) {
      res.status(401).json({ error: 'Token webhook tidak valid.' });
      return;
    }

    const body = req.body as XenditInvoiceCallback;
    if (!body.id || !body.status) {
      res.status(200).json({ received: true, note: 'Payload tidak lengkap, diabaikan.' });
      return;
    }

    const payment = await prisma.payment.findUnique({ where: { xenditInvoiceId: body.id } });
    if (!payment) {
      // Could be a webhook for an invoice this server didn't create (e.g.
      // test event) — acknowledge without erroring so Xendit doesn't retry.
      res.status(200).json({ received: true, note: 'Payment record not found.' });
      return;
    }

    if (body.status === 'PAID' && payment.status !== 'PAID') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paidAt: body.paid_at ? new Date(body.paid_at) : new Date() },
      });

      const periodEnd = new Date(Date.now() + SUBSCRIPTION_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      await prisma.subscription.upsert({
        where: { userId: payment.userId },
        create: {
          userId: payment.userId,
          planId: payment.planId,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
        update: {
          planId: payment.planId,
          status: 'ACTIVE',
          currentPeriodEnd: periodEnd,
        },
      });
    } else if (body.status === 'EXPIRED' && payment.status === 'PENDING') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});
