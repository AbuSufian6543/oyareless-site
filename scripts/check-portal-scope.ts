import { scopeToCustomer, TenantIsolationError } from "../src/lib/portal-scope";

let failed = 0;

function assert(label: string, ok: boolean) {
  if (ok) console.log(`  OK    ${label}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${label}`);
  }
}

const ticketA = { id: "t1", customerId: "cust-a", subject: "A" };
const ticketB = { id: "t2", customerId: "cust-b", subject: "B" };

assert("matching customer is returned", scopeToCustomer(ticketA, "cust-a").id === "t1");

let threw = false;
try {
  scopeToCustomer(ticketB, "cust-a");
} catch (error) {
  threw = error instanceof TenantIsolationError;
}
assert("cross-tenant ticket is refused", threw);

threw = false;
try {
  scopeToCustomer(null, "cust-a");
} catch (error) {
  threw = error instanceof TenantIsolationError;
}
assert("missing record is refused", threw);

threw = false;
try {
  scopeToCustomer({ id: "x", customerId: null }, "cust-a");
} catch (error) {
  threw = error instanceof TenantIsolationError;
}
assert("unlinked quote cannot be read as a ticket", threw);

process.exit(failed === 0 ? 0 : 1);
