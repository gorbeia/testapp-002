import { createHash } from 'crypto';
import type { ITicketBaiProvider, IssueInvoiceInput, IssueInvoiceResult } from './types';

const TBAI_VERSION = '1.2';
const QR_BASE_URL = 'https://batuz.eus/QRTBAI/';
const SOFTWARE_LICENSE = 'TBAITEST-00001-LICENCIA';
const SOFTWARE_NIF = '00000000T';
const SOFTWARE_NAME = 'TxosnaBai';
const SOFTWARE_VERSION = '1.0';
const DEVICE_SERIAL = 'TxosnaBai-001';

export class MockTicketBaiProvider implements ITicketBaiProvider {
  public issued: IssueInvoiceInput[] = [];

  async validate(): Promise<{ ok: boolean; error?: string }> {
    return { ok: true };
  }

  async issue(input: IssueInvoiceInput): Promise<IssueInvoiceResult> {
    this.issued.push(input);

    const xml = buildTicketBaiXml(input);
    // Mix in previousChainId so the chainId is sensitive to the chain linkage
    // even when the chain block can't appear in the XML (e.g. previousInvoice absent).
    const chainId = createHash('sha256')
      .update(xml, 'utf8')
      .update(input.previousChainId ?? 'FIRST')
      .digest('hex');
    const huella13 = chainId.toUpperCase().substring(0, 13);
    const tbaiId = buildTbaiId(input, huella13);
    const qrUrl = `${QR_BASE_URL}?id=${encodeURIComponent(tbaiId)}`;
    const paddedNumber = String(input.invoiceNumber).padStart(8, '0');
    const providerRef = `TBAI-${input.series}-${paddedNumber}`;

    return { providerRef, qrUrl, xmlPayload: xml, chainId, status: 'MOCK' };
  }
}

function buildTbaiId(input: IssueInvoiceInput, huella13: string): string {
  const d = input.issuedAt;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const idWithoutCd = `TBAI-${input.sellerCif.toUpperCase()}-${dd}${mm}${yyyy}-${huella13}`;
  const cd = computeControlDigits(idWithoutCd);
  return `${idWithoutCd}-${cd}`;
}

// ISO 7064 MOD 97-10: digits stay as-is; A-Z expand to two-digit values (A=10…Z=35).
// Hyphens and other separators are skipped.
function computeControlDigits(id: string): string {
  let rem = 0;
  for (const ch of id) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      rem = (rem * 10 + (code - 48)) % 97;
    } else if (code >= 65 && code <= 90) {
      const val = code - 55; // A=10, B=11 … Z=35
      rem = (rem * 10 + Math.floor(val / 10)) % 97;
      rem = (rem * 10 + (val % 10)) % 97;
    }
  }
  return (98 - rem).toString().padStart(2, '0');
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}

function fmtTime(d: Date): string {
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

function amt(n: number): string {
  return n.toFixed(2);
}

function buildTicketBaiXml(input: IssueInvoiceInput): string {
  const paddedNum = String(input.invoiceNumber).padStart(8, '0');
  const date = fmtDate(input.issuedAt);
  const time = fmtTime(input.issuedAt);

  const lineItems = input.lines
    .map(
      (l) =>
        `      <IDDetalleFactura>
        <DescripcionDetalle>${esc(l.description)}</DescripcionDetalle>
        <Cantidad>${amt(l.quantity)}</Cantidad>
        <ImporteUnitario>${amt(l.unitPrice)}</ImporteUnitario>
        <Descuento>0.00</Descuento>
        <ImporteTotal>${amt(l.quantity * l.unitPrice)}</ImporteTotal>
      </IDDetalleFactura>`
    )
    .join('\n');

  const vatItems = input.vatBreakdown
    .map(
      (v) =>
        `          <DetalleIVA>
            <TipoImpositivo>${amt(v.rate)}</TipoImpositivo>
            <BaseImponible>${amt(v.base)}</BaseImponible>
            <CuotaImpuesto>${amt(v.vatAmount)}</CuotaImpuesto>
            <CuotaRecargoEquivalencia>0.00</CuotaRecargoEquivalencia>
          </DetalleIVA>`
    )
    .join('\n');

  const prev = input.previousInvoice;
  const chainBlock =
    prev && input.previousChainId
      ? `
    <EncadenamientoFacturaAnterior>
      <SerieFacturaAnterior>${esc(prev.series)}</SerieFacturaAnterior>
      <NumFacturaAnterior>${String(prev.invoiceNumber).padStart(8, '0')}</NumFacturaAnterior>
      <FechaExpedicionFacturaAnterior>${fmtDate(prev.issuedAt)}</FechaExpedicionFacturaAnterior>
      <FirmaFacturaAnterior>${input.previousChainId}</FirmaFacturaAnterior>
    </EncadenamientoFacturaAnterior>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<T:TicketBai xmlns:T="urn:ticketbai:emision" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Cabecera>
    <IDVersionTBAI>${TBAI_VERSION}</IDVersionTBAI>
  </Cabecera>
  <Sujetos>
    <Emisor>
      <NIF>${esc(input.sellerCif)}</NIF>
      <ApellidosNombreRazonSocial>${esc(input.sellerName)}</ApellidosNombreRazonSocial>
    </Emisor>
    <VariosDestinatarios>N</VariosDestinatarios>
    <EmitidaPorTercerosODestinatario>N</EmitidaPorTercerosODestinatario>
  </Sujetos>
  <Factura>
    <CabeceraFactura>
      <SerieFactura>${esc(input.series)}</SerieFactura>
      <NumFactura>${paddedNum}</NumFactura>
      <FechaExpedicionFacturaEmisor>${date}</FechaExpedicionFacturaEmisor>
      <HoraExpedicionFactura>${time}</HoraExpedicionFactura>
      <FacturaSimplificada>S</FacturaSimplificada>
      <FacturaEmitidaSustitucionSimplificada>N</FacturaEmitidaSustitucionSimplificada>
    </CabeceraFactura>
    <DatosFactura>
      <FechaOperacion>${date}</FechaOperacion>
      <DescripcionFactura>Venta festival</DescripcionFactura>
      <DetallesFactura>
${lineItems}
      </DetallesFactura>
      <ImporteTotalFactura>${amt(input.total)}</ImporteTotalFactura>
      <Claves>
        <IDClave>
          <ClaveRegimenIvaOpTrascendencia>01</ClaveRegimenIvaOpTrascendencia>
        </IDClave>
      </Claves>
    </DatosFactura>
    <TipoDesglose>
      <DesgloseFactura>
        <Sujeta>
          <NoExenta>
            <DetalleNoExenta>
              <TipoNoExenta>S1</TipoNoExenta>
              <DesgloseIVA>
${vatItems}
              </DesgloseIVA>
            </DetalleNoExenta>
          </NoExenta>
        </Sujeta>
      </DesgloseFactura>
    </TipoDesglose>
  </Factura>
  <HuellaTBAI>${chainBlock}
    <Software>
      <LicenciaTBAI>${SOFTWARE_LICENSE}</LicenciaTBAI>
      <EntidadDesarrolladora>
        <NIF>${SOFTWARE_NIF}</NIF>
      </EntidadDesarrolladora>
      <Nombre>${SOFTWARE_NAME}</Nombre>
      <Version>${SOFTWARE_VERSION}</Version>
    </Software>
    <NumSerieDispositivo>${DEVICE_SERIAL}</NumSerieDispositivo>
  </HuellaTBAI>
</T:TicketBai>`;
}
