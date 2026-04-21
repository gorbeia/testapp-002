Feature: Tenant Isolation Security

Background:
  Given two associations exist:
    | name | id |
    | Association A | assoc-a |
    | Association B | assoc-b |
  And Association A has a volunteer:
    | email | password | name | id |
    | alice@a.example | secret | Alice | vol-a |
  And Association B has a volunteer:
    | email | password | name | id |
    | bob@b.example | secret | Bob | vol-b |
  And Association A has a txosna:
    | slug | name | status | id |
    | txosna-a | Txosna A | OPEN | txosna-a |
  And Association B has a txosna:
    | slug | name | status | id |
    | txosna-b | Txosna B | OPEN | txosna-b |

Scenario: Volunteer from Association A cannot view tickets from Association B
  Given Association B has orders with tickets:
    | orderId | txosnaId | ticketId | status |
    | ord-b-1 | txosna-b | ticket-b-1 | RECEIVED |
  When Alice (volunteer from Association A) logs in
  And Alice requests GET /api/txosnak/txosna-b/tickets
  Then the response status is 403 Forbidden

Scenario: Volunteer from Association A cannot update tickets from Association B
  Given Association B has orders with tickets:
    | orderId | txosnaId | ticketId | status |
    | ord-b-1 | txosna-b | ticket-b-1 | RECEIVED |
  When Alice (volunteer from Association A) logs in
  And Alice requests PATCH /api/tickets/ticket-b-1 with status IN_PREPARATION
  Then the response status is 403 Forbidden
  And ticket-b-1 status remains RECEIVED

Scenario: Volunteer from Association A cannot confirm orders from Association B
  Given Association B has orders:
    | orderId | txosnaId | status |
    | ord-b-1 | txosna-b | PENDING_PAYMENT |
  When Alice (volunteer from Association A) logs in
  And Alice requests POST /api/orders/ord-b-1/confirm
  Then the response status is 403 Forbidden
  And ord-b-1 status remains PENDING_PAYMENT

Scenario: Volunteer from Association A cannot cancel orders from Association B
  Given Association B has orders:
    | orderId | txosnaId | status |
    | ord-b-1 | txosna-b | CONFIRMED |
  When Alice (volunteer from Association A) logs in
  And Alice requests POST /api/orders/ord-b-1/cancel with reason VOLUNTEER_MISTAKE
  Then the response status is 403 Forbidden
  And ord-b-1 status remains CONFIRMED

Scenario: Volunteer from Association A cannot create counter orders on Association B's txosna
  When Alice (volunteer from Association A) logs in
  And Alice requests POST /api/txosnak/txosna-b/orders with:
    | channel | COUNTER |
    | customerName | |
    | paymentMethod | CASH |
    | lines | [] |
  Then the response status is 403 Forbidden

Scenario: Admin from Association A cannot modify VAT types from Association B
  Given Association B has a VAT type:
    | id | label | percentage | associationId |
    | vat-b-1 | VAT 21% | 21 | assoc-b |
  When Alice (admin from Association A) logs in with role ADMIN
  And Alice requests PATCH /api/vat-types/vat-b-1 with percentage 25
  Then the response status is 403 Forbidden
  And vat-b-1 percentage remains 21

Scenario: Admin from Association A cannot delete VAT types from Association B
  Given Association B has a VAT type:
    | id | label | percentage | associationId |
    | vat-b-1 | VAT 21% | 21 | assoc-b |
  When Alice (admin from Association A) logs in with role ADMIN
  And Alice requests DELETE /api/vat-types/vat-b-1
  Then the response status is 403 Forbidden
  And vat-b-1 still exists in the database

Scenario: Volunteer from Association A CAN view and update their own tickets
  Given Association A has orders with tickets:
    | orderId | txosnaId | ticketId | status |
    | ord-a-1 | txosna-a | ticket-a-1 | RECEIVED |
  When Alice (volunteer from Association A) logs in
  And Alice requests GET /api/txosnak/txosna-a/tickets
  Then the response status is 200
  And the response includes ticket-a-1
  When Alice requests PATCH /api/tickets/ticket-a-1 with status IN_PREPARATION
  Then the response status is 200
  And ticket-a-1 status changes to IN_PREPARATION

Scenario: Customer can access orders with correct verification code (cross-association safe)
  Given Association A has orders:
    | orderId | txosnaId | verificationCode |
    | ord-a-1 | txosna-a | verify123 |
  And Association B has orders:
    | orderId | txosnaId | verificationCode |
    | ord-b-1 | txosna-b | verify456 |
  When an unauthenticated customer requests GET /api/orders/ord-a-1?verificationCode=verify123
  Then the response status is 200
  And the response includes ord-a-1 details
  When an unauthenticated customer requests GET /api/orders/ord-a-1?verificationCode=verify456
  Then the response status is 403 Forbidden or 404 Not Found
