import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { createXenditInvoice, XenditNotConfiguredError } from '../lib/xendit.js'

export const subscriptionRouter = Router()
subscriptionRouter.use(requireAuth)

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

// GET /api/subscription/me — current user's subscription + plan, with a
// convenience `daysLeft` (for trials) and `isExpired` flag the frontend can
// render directly without recomputing dates itself.
subscriptionRouter.get('/me', async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.auth!.userId },
      include: { plan: true },
    })
    if (!subscription || !subscription.plan) {
      res.status(404).json({ error: 'Belum ada langganan untuk akun ini.' })
      return
    }

    const now = new Date()
    const msLeft = subscription.currentPeriodEnd.getTime() - now.getTime()
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)))

    res.json({
      status: subscription.status,
      planId: subscription.planId,
      planName: subscription.plan.name,
      currentPeriodEnd: subscription.currentPeriodEnd,
      daysLeft,
      isExpired: msLeft <= 0,
      // Access stays valid until currentPeriodEnd even when CANCELED — this
      // just tells the frontend "won't renew automatically", not "locked out
      // right now". See requireActiveAccess in middleware/auth.ts.
      cancelAtPeriodEnd: subscription.status === 'CANCELED',
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/subscription/payments — this user's payment history, newest first.
subscriptionRouter.get('/payments', async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.auth!.userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(
      payments
        .filter((p) => p.plan)
        .map((p) => ({
          id: p.id,
          planName: p.plan!.name,
          amount: p.amount,
          status: p.status,
          invoiceUrl: p.status === 'PENDING' ? p.xenditInvoiceUrl : null,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
    )
  } catch (err) {
    next(err)
  }
})

const checkoutSchema = z.object({ planId: z.enum(['basic', 'pro']) })

// POST /api/subscription/checkout — body { planId: 'basic' | 'pro' }.
// Creates a Xendit-hosted invoice and returns its URL for the frontend to
// redirect the browser to. The subscription itself only actually upgrades
// once Xendit confirms payment via the webhook (routes/webhooks.ts) — this
// endpoint just starts the checkout, it doesn't grant access by itself.
subscriptionRouter.post('/checkout', async (req, res, next) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: '"planId" harus "basic" atau "pro".' })
      return
    }

    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.auth!.userId } }),
      prisma.plan.findUnique({ where: { id: parsed.data.planId } }),
    ])
    if (!user || !plan) {
      res.status(404).json({ error: 'Akun atau paket tidak ditemukan.' })
      return
    }

    const externalId = `sub-${user.id}-${plan.id}-${Date.now()}`

    let invoice
    try {
      invoice = await createXenditInvoice({
        externalId,
        amount: plan.priceIdr,
        payerEmail: user.email,
        description: `Langganan ${plan.name} — Perpustakaan Belajar`,
        successRedirectUrl: `${APP_URL}/akun/langganan?status=success`,
        failureRedirectUrl: `${APP_URL}/akun/langganan?status=failed`,
      })
    } catch (err) {
      if (err instanceof XenditNotConfiguredError) {
        res.status(503).json({ error: err.message })
        return
      }
      throw err
    }

    await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.priceIdr,
        status: 'PENDING',
        xenditInvoiceId: invoice.id,
        xenditInvoiceUrl: invoice.invoice_url,
      },
    })

    res.status(201).json({ invoiceUrl: invoice.invoice_url })
  } catch (err) {
    next(err)
  }
})

// POST /api/subscription/cancel — stops auto-renewal. Access is NOT revoked
// immediately: the subscription keeps working until currentPeriodEnd, which
// is untouched here (standard "cancel takes effect at period end" behavior,
// consistent with requireActiveAccess's date-only gating rule).
subscriptionRouter.post('/cancel', async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.auth!.userId },
    })
    if (!subscription) {
      res.status(404).json({ error: 'Belum ada langganan untuk akun ini.' })
      return
    }
    if (subscription.planId === 'free_trial') {
      res.status(400).json({
        error:
          'Masa percobaan gratis tidak perlu dibatalkan — cukup jangan berlangganan paket berbayar.',
      })
      return
    }
    if (subscription.status === 'CANCELED') {
      res
        .status(400)
        .json({ error: 'Langganan ini sudah dibatalkan sebelumnya.' })
      return
    }

    const updated = await prisma.subscription.update({
      where: { userId: req.auth!.userId },
      data: { status: 'CANCELED' },
    })

    res.json({
      status: updated.status,
      currentPeriodEnd: updated.currentPeriodEnd,
    })
  } catch (err) {
    next(err)
  }
})
