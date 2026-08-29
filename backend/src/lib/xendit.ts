import crypto from 'node:crypto';

const XENDIT_API_URL = 'https://api.xendit.co';

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  status: string;
  invoice_url: string;
  amount: number;
}

export class XenditNotConfiguredError extends Error {
  constructor() {
    super(
      'XENDIT_SECRET_KEY belum diset di server. Tambahkan di file .env (lihat backend/README.md bagian Pembayaran/Langganan).'
    );
  }
}

/** Creates a hosted-checkout invoice via Xendit's Invoice API (v2).
 *  Docs: POST https://api.xendit.co/v2/invoices, Basic Auth with the secret
 *  API key as username and an empty password. Returns `invoice_url` — the
 *  page the customer should be redirected to to pay. */
export async function createXenditInvoice(params: CreateInvoiceParams): Promise<XenditInvoice> {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    throw new XenditNotConfiguredError();
  }

  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const res = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      currency: 'IDR',
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Xendit menolak permintaan (${res.status})`);
  }

  return (await res.json()) as XenditInvoice;
}

/** Verifies the `x-callback-token` header Xendit sends on every webhook
 *  event against our configured XENDIT_CALLBACK_TOKEN, using a timing-safe
 *  comparison (constant-time, so a partial-match timing side-channel can't
 *  be used to guess the token byte-by-byte). */
export function verifyXenditCallbackToken(receivedToken: string | undefined): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected || !receivedToken) return false;
  const a = Buffer.from(receivedToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
