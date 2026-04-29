const ALLOWED_HOSTS = new Set(['sis-t.redsys.es', 'sis.redsys.es']);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redsysUrl = searchParams.get('redsysUrl') ?? '';
  const Ds_SignatureVersion = searchParams.get('Ds_SignatureVersion') ?? '';
  const Ds_MerchantParameters = searchParams.get('Ds_MerchantParameters') ?? '';
  const Ds_Signature = searchParams.get('Ds_Signature') ?? '';

  let hostname: string;
  try {
    hostname = new URL(redsysUrl).hostname;
  } catch {
    return Response.json({ error: 'Invalid redsysUrl' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(hostname)) {
    return Response.json({ error: 'Disallowed redsysUrl host' }, { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting…</title></head>
<body>
<form id="f" method="POST" action="${escapeHtml(redsysUrl)}">
  <input type="hidden" name="Ds_SignatureVersion" value="${escapeHtml(Ds_SignatureVersion)}">
  <input type="hidden" name="Ds_MerchantParameters" value="${escapeHtml(Ds_MerchantParameters)}">
  <input type="hidden" name="Ds_Signature" value="${escapeHtml(Ds_Signature)}">
</form>
<script>const form = document.getElementById('f'); form.submit();</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
