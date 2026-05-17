import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { txosnaRepo, orderRepo, ticketRepo, ticketBaiInvoiceRepo } from '@/lib/store';

interface Props {
  params: Promise<{ locale: string; slug: string; code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, code } = await params;
  const txosna = await txosnaRepo.findBySlug(slug);
  const order = txosna
    ? await orderRepo.findByVerificationCode(txosna.id, code.toUpperCase())
    : null;
  return { title: order ? `Txartela #${order.orderNumber}` : 'Txartela' };
}

export default async function ReceiptPage({ params }: Props) {
  const { locale: _locale, slug, code } = await params;

  const txosna = await txosnaRepo.findBySlug(slug);
  if (!txosna || !txosna.mobileTrackingEnabled) notFound();

  const order = await orderRepo.findByVerificationCode(txosna.id, code.toUpperCase());
  if (!order) notFound();

  const [tickets, fiscalInvoice] = await Promise.all([
    ticketRepo.listByOrder(order.id),
    order.fiscalReceiptRef ? ticketBaiInvoiceRepo.findByOrder(order.id) : null,
  ]);

  const confirmedDate = order.confirmedAt ?? order.createdAt;
  const dateStr = confirmedDate.toLocaleDateString('eu-EU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const allLines = tickets.flatMap((t) => t.lines);

  return (
    <div className="receipt">
      <style>{`
        .receipt { font-family: system-ui, sans-serif; font-size: 14px; color: #111; background: #fff; padding: 24px 20px; max-width: 420px; margin: 0 auto; }
        .receipt * { box-sizing: border-box; }
        .r-header { margin-bottom: 20px; }
        .r-txosna-name { font-size: 20px; font-weight: 700; }
        .r-meta { font-size: 12px; color: #666; margin-top: 4px; }
        .r-order-number { font-size: 16px; font-weight: 600; margin: 16px 0 4px; }
        .r-customer { font-size: 13px; color: #555; }
        .receipt hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
        .r-line { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; }
        .r-line-name { flex: 1; font-size: 13px; }
        .r-line-detail { font-size: 12px; color: #777; margin-top: 2px; }
        .r-line-price { font-size: 13px; white-space: nowrap; font-weight: 500; }
        .r-total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; padding: 12px 0; }
        .r-footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 24px; }
        .r-fiscal { margin-top: 16px; padding: 12px 14px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .r-fiscal-label { font-size: 10px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .r-fiscal-ref { font-family: monospace; font-size: 14px; font-weight: 700; }
        .r-fiscal-qr { display: inline-block; margin-top: 8px; font-size: 12px; color: #e85d2f; text-decoration: none; }
        .r-print-btn { display: block; width: 100%; margin-top: 24px; padding: 14px; background: #e85d2f; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; }
        @media print { .r-print-btn { display: none; } }
      `}</style>

      <div className="r-header">
        <div className="r-txosna-name">{txosna.name}</div>
        <div className="r-meta">{dateStr}</div>
      </div>

      <div className="r-order-number">Eskaera #{order.orderNumber}</div>
      {order.customerName && <div className="r-customer">{order.customerName}</div>}

      <hr />

      {allLines.map((line, i) => {
        const details: string[] = [];
        if (line.selectedVariant) details.push(line.selectedVariant);
        if (line.selectedModifiers.length > 0) details.push(line.selectedModifiers.join(', '));
        return (
          <div key={i} className="r-line">
            <div className="r-line-name">
              {line.quantity > 1 && <span>{line.quantity}× </span>}
              {line.productName}
              {details.length > 0 && <div className="r-line-detail">{details.join(' · ')}</div>}
            </div>
            <div className="r-line-price">{(line.unitPrice * line.quantity).toFixed(2)} €</div>
          </div>
        );
      })}

      <hr />

      <div className="r-total-row">
        <span>Guztira</span>
        <span>{order.total.toFixed(2)} €</span>
      </div>

      {fiscalInvoice ? (
        <div className="r-fiscal">
          <div className="r-fiscal-label">Txartel argia / Faktura</div>
          <div className="r-fiscal-ref">
            {fiscalInvoice.series}-{String(fiscalInvoice.invoiceNumber).padStart(8, '0')}
          </div>
          {fiscalInvoice.qrUrl && (
            <a className="r-fiscal-qr" href={fiscalInvoice.qrUrl}>
              QR kodea ikusi → {fiscalInvoice.qrUrl}
            </a>
          )}
        </div>
      ) : (
        <div className="r-footer">Ez da zerga-dokumentua</div>
      )}

      <button className="r-print-btn">🖨 Inprimatu</button>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('.r-print-btn').addEventListener('click', () => window.print())`,
        }}
      />
    </div>
  );
}
