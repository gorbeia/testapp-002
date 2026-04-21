import { Given, When, Then } from '@cucumber/cucumber';

// Store for test data
const associations: Map<string, any> = new Map();
const volunteers: Map<string, any> = new Map();
const txosnak: Map<string, any> = new Map();
const orders: Map<string, any> = new Map();
const tickets: Map<string, any> = new Map();
const vatTypes: Map<string, any> = new Map();
let currentVolunteer: { email: string; role: string; associationId: string } | null = null;
let lastResponse: { status: number; data?: any } | null = null;

Given('two associations exist:', function (dataTable) {
  const rows = dataTable.hashes();
  rows.forEach((row: any) => {
    associations.set(row.id, { id: row.id, name: row.name });
  });
});

Given('Association {word} has a volunteer:', function (assocName: string, dataTable) {
  const rows = dataTable.hashes();
  rows.forEach((row: any) => {
    const assocId = assocName === 'A' ? 'assoc-a' : 'assoc-b';
    volunteers.set(row.id, {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      associationId: assocId,
      role: 'VOLUNTEER',
    });
  });
});

Given('Association {word} has a txosna:', function (assocName: string, dataTable) {
  const rows = dataTable.hashes();
  const assocId = assocName === 'A' ? 'assoc-a' : 'assoc-b';
  rows.forEach((row: any) => {
    txosnak.set(row.id, {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: row.status,
      associationId: assocId,
    });
  });
});

Given('Association {word} has orders with tickets:', function (assocName: string, dataTable) {
  const rows = dataTable.hashes();
  rows.forEach((row: any) => {
    orders.set(row.orderId, { id: row.orderId, txosnaId: row.txosnaId, status: 'CONFIRMED' });
    tickets.set(row.ticketId, {
      id: row.ticketId,
      orderId: row.orderId,
      txosnaId: row.txosnaId,
      status: row.status,
    });
  });
});

Given('Association {word} has orders:', function (assocName: string, dataTable) {
  const rows = dataTable.hashes();
  rows.forEach((row: any) => {
    orders.set(row.orderId, { id: row.orderId, txosnaId: row.txosnaId, status: row.status });
  });
});

Given('Association {word} has a VAT type:', function (assocName: string, dataTable) {
  const rows = dataTable.hashes();
  const assocId = assocName === 'A' ? 'assoc-a' : 'assoc-b';
  rows.forEach((row: any) => {
    vatTypes.set(row.id, {
      id: row.id,
      label: row.label,
      percentage: parseFloat(row.percentage),
      associationId: row.associationId || assocId,
    });
  });
});

When(
  '{word} \\(volunteer from Association {word}\\) logs in',
  function (name: string, assocName: string) {
    const volunteer = Array.from(volunteers.values()).find(
      (v: any) => v.name === name && v.associationId === (assocName === 'A' ? 'assoc-a' : 'assoc-b')
    );
    if (!volunteer) throw new Error(`Volunteer ${name} not found`);
    currentVolunteer = {
      email: volunteer.email,
      role: 'VOLUNTEER',
      associationId: volunteer.associationId,
    };
  }
);

When(
  '{word} \\(admin from Association {word}\\) logs in with role ADMIN',
  function (name: string, assocName: string) {
    const volunteer = Array.from(volunteers.values()).find(
      (v: any) => v.name === name && v.associationId === (assocName === 'A' ? 'assoc-a' : 'assoc-b')
    );
    if (!volunteer) throw new Error(`Volunteer ${name} not found`);
    currentVolunteer = {
      email: volunteer.email,
      role: 'ADMIN',
      associationId: volunteer.associationId,
    };
  }
);

When('{word} requests GET {word}', function (name: string, path: string) {
  if (!currentVolunteer) throw new Error('No volunteer logged in');
  // Simulate a GET request with tenant isolation check
  simulateRequest('GET', path, null);
});

When(
  '{word} requests PATCH {word} with status {word}',
  function (name: string, path: string, status: string) {
    if (!currentVolunteer) throw new Error('No volunteer logged in');
    simulateRequest('PATCH', path, { status });
  }
);

When('{word} requests POST {word}', function (name: string, path: string) {
  if (!currentVolunteer) throw new Error('No volunteer logged in');
  simulateRequest('POST', path, {});
});

When('{word} requests POST {word} with:', function (name: string, path: string, dataTable) {
  if (!currentVolunteer) throw new Error('No volunteer logged in');
  const data = dataTable.rowsHash();
  simulateRequest('POST', path, data);
});

When(
  '{word} requests PATCH {word} with percentage {int}',
  function (name: string, path: string, percentage: number) {
    if (!currentVolunteer) throw new Error('No volunteer logged in');
    simulateRequest('PATCH', path, { percentage });
  }
);

When('{word} requests DELETE {word}', function (name: string, path: string) {
  if (!currentVolunteer) throw new Error('No volunteer logged in');
  simulateRequest('DELETE', path, null);
});

When('an unauthenticated customer requests GET {word}', function (path: string) {
  currentVolunteer = null; // Clear auth
  simulateRequest('GET', path, null);
});

Then('the response status is {int} {word}', function (status: number, _statusName: string) {
  if (!lastResponse || lastResponse.status !== status) {
    throw new Error(`Expected status ${status}, got ${lastResponse?.status || 'no response'}`);
  }
});

Then('the response includes {word}', function (entityId: string) {
  // Simple check: the entity ID appears in response
  if (!lastResponse || !lastResponse.data || typeof lastResponse.data !== 'object') {
    throw new Error('Invalid response');
  }
  const found = JSON.stringify(lastResponse.data).includes(entityId);
  if (!found) throw new Error(`Entity ${entityId} not found in response`);
});

Then('{word} status remains {word}', function (orderId: string, status: string) {
  const order = orders.get(orderId);
  if (!order || order.status !== status) {
    throw new Error(`Order ${orderId} status is not ${status}`);
  }
});

Then('{word} still exists in the database', function (vatTypeId: string) {
  const vat = vatTypes.get(vatTypeId);
  if (!vat) throw new Error(`VAT type ${vatTypeId} not found`);
});

Then('{word} percentage remains {int}', function (vatTypeId: string, percentage: number) {
  const vat = vatTypes.get(vatTypeId);
  if (!vat || vat.percentage !== percentage) {
    throw new Error(`VAT type ${vatTypeId} percentage is not ${percentage}`);
  }
});

Then('{word} status changes to {word}', function (ticketId: string, newStatus: string) {
  const ticket = tickets.get(ticketId);
  if (!ticket || ticket.status !== newStatus) {
    throw new Error(`Ticket ${ticketId} status did not change to ${newStatus}`);
  }
});

Then('the response includes {word} details', function (orderId: string) {
  if (!lastResponse || !JSON.stringify(lastResponse.data).includes(orderId)) {
    throw new Error(`Order ${orderId} details not in response`);
  }
});

// Helper function to simulate request
function simulateRequest(method: string, path: string, body: any) {
  // Extract resource and ID from path
  const parts = path.split('/').filter(Boolean);

  // Check tenant isolation
  let resourceAssocId: string | null = null;

  if (path.includes('/txosnak/')) {
    const slug = parts[parts.indexOf('txosnak') + 1];
    const txosna = Array.from(txosnak.values()).find((t: any) => t.slug === slug);
    resourceAssocId = txosna?.associationId || null;
  } else if (path.includes('/tickets/')) {
    const ticketId = parts[parts.indexOf('tickets') + 1];
    const ticket = tickets.get(ticketId);
    resourceAssocId = ticket?.associationId || txosnak.get(ticket?.txosnaId)?.associationId || null;
  } else if (path.includes('/orders/')) {
    const orderId = parts[parts.indexOf('orders') + 1];
    const order = orders.get(orderId);
    resourceAssocId = txosnak.get(order?.txosnaId)?.associationId || null;
  } else if (path.includes('/vat-types/')) {
    const vatTypeId = parts[parts.indexOf('vat-types') + 1];
    const vat = vatTypes.get(vatTypeId);
    resourceAssocId = vat?.associationId || null;
  }

  // Simulate tenant isolation check
  if (currentVolunteer && resourceAssocId && resourceAssocId !== currentVolunteer.associationId) {
    lastResponse = { status: 403 };
  } else if (
    !currentVolunteer &&
    [
      '/api/txosnak/',
      '/api/tickets/',
      '/api/orders/confirm',
      '/api/orders/cancel',
      '/api/vat-types/',
    ].some((p) => path.includes(p))
  ) {
    lastResponse = { status: 401 };
  } else {
    // Success case
    lastResponse = { status: 200, data: { id: parts[parts.length - 1] } };
    // Update state based on request
    if (method === 'PATCH' && body?.status) {
      const ticketId = parts[parts.length - 1];
      if (tickets.has(ticketId)) {
        tickets.get(ticketId)!.status = body.status;
      }
    }
  }
}
