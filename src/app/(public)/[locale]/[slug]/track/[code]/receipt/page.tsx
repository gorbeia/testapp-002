import { notFound } from 'next/navigation';
import { txosnaRepo, orderRepo, ticketRepo, ticketBaiInvoiceRepo } from '@/lib/store';

interface Props {
  params: Promise<{ locale: string; slug: string; code: string }>;
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
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Txartela #{order.orderNumber}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, sans-serif;
            font-size: 14px;
            color: #111;
            background: #fff;
            padding: 24px 20px;
            max-width: 420px;
            margin: 0 auto;
          }
          .header { margin-bottom: 20px; }
          .txosna-name { font-size: 20px; font-weight: 700; }
          .meta { font-size: 12px; color: #666; margin-top: 4px; }
          .order-number { font-size: 16px; font-weight: 600; margin: 16px 0 4px; }
          .customer { font-size: 13px; color: #555; }
          hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
          .line { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; }
          .line-name { flex: 1; font-size: 13px; }
          .line-detail { font-size: 12px; color: #777; margin-top: 2px; }
          .line-price { font-size: 13px; white-space: nowrap; font-weight: 500; }
          .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; padding: 12px 0; }
          .footer { font-size: 11px; color: #aaa; text-align: center; margin-top: 24px; }
          .fiscal { margin-top: 16px; padding: 12px 14px; border: 1px solid #e0e0e0; border-radius: 8px; }
          .fiscal-label { font-size: 10px; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
          .fiscal-ref { font-family: monospace; font-size: 14px; font-weight: 700; }
          .fiscal-qr { display: inline-block; margin-top: 8px; font-size: 12px; color: #e85d2f; text-decoration: none; }
          .print-btn {
            display: block;
            width: 100%;
            margin-top: 24px;
            padding: 14px;
            background: #e85d2f;
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }
          @media print {
            .print-btn { display: none; }
            body { padding: 0; }
          }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div className="txosna-name">{txosna.name}</div>
          <div className="meta">{dateStr}</div>
        </div>

        <div className="order-number">Eskaera #{order.orderNumber}</div>
        {order.customerName && <div className="customer">{order.customerName}</div>}

        <hr />

        {allLines.map((line, i) => {
          const details: string[] = [];
          if (line.selectedVariant) details.push(line.selectedVariant);
          if (line.selectedModifiers.length > 0) details.push(line.selectedModifiers.join(', '));
          return (
            <div key={i} className="line">
              <div className="line-name">
                {line.quantity > 1 && <span>{line.quantity}× </span>}
                {line.productName}
                {details.length > 0 && <div className="line-detail">{details.join(' · ')}</div>}
              </div>
              <div className="line-price">{(line.unitPrice * line.quantity).toFixed(2)} €</div>
            </div>
          );
        })}

        <hr />

        <div className="total-row">
          <span>Guztira</span>
          <span>{order.total.toFixed(2)} €</span>
        </div>

        {fiscalInvoice ? (
          <div className="fiscal">
            <div className="fiscal-label">Txartel argia / Faktura</div>
            <div className="fiscal-ref">
              {fiscalInvoice.series}-{String(fiscalInvoice.invoiceNumber).padStart(8, '0')}
            </div>
            {fiscalInvoice.qrUrl && (
              <a className="fiscal-qr" href={fiscalInvoice.qrUrl}>
                QR kodea ikusi → {fiscalInvoice.qrUrl}
              </a>
            )}
          </div>
        ) : (
          <div className="footer">Ez da zerga-dokumentua</div>
        )}

        <button className="print-btn" onClick={undefined}>
          🖨 Inprimatu
        </button>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.querySelector('.print-btn').addEventListener('click', () => window.print())`,
          }}
        />
      </body>
    </html>
  );
}
