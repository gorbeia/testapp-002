// Simple test to verify invoice API and seed data
import('./src/lib/store/memory.js')
  .then(async ({ resetStore, ticketBaiInvoiceRepo }) => {
    console.warn('Testing invoice seed data...');

    // Reset and seed the store
    resetStore();

    // Check if invoices exist for assoc-1
    const invoices = await ticketBaiInvoiceRepo.listByAssociation('assoc-1');
    console.warn(`Found ${invoices.length} invoices for assoc-1:`);
    invoices.forEach((inv) => {
      console.warn(
        `- ${inv.series}-${String(inv.invoiceNumber).padStart(8, '0')} (Order: ${inv.orderNumber})`
      );
    });

    // Check demo association too
    const demoInvoices = await ticketBaiInvoiceRepo.listByAssociation('demo-assoc-1');
    console.warn(`Found ${demoInvoices.length} invoices for demo-assoc-1:`);
    demoInvoices.forEach((inv) => {
      console.warn(
        `- ${inv.series}-${String(inv.invoiceNumber).padStart(8, '0')} (Order: ${inv.orderNumber})`
      );
    });
  })
  .catch(console.error);
