window.PROCESS_DATA = {
  nodes: [
    { id: "start", num: "1", title: "Order booked", owner: "Presales", type: "start", risk: "low", desc: "Customer order is approved and entered.", x: 70, y: 50 },
    { id: "config", num: "2", title: "Order configured", owner: "Presales", type: "task", risk: "medium", desc: "Hardware configuration and initial BOM are prepared.", x: 70, y: 155 },
    { id: "bom", num: "3", title: "BOM reviewed", owner: "Project Team", type: "task", risk: "high", desc: "BOM is checked against customer scope, design, dependencies, and install requirements.", x: 70, y: 260 },
    { id: "scope", num: "4", title: "BOM aligns with scope?", owner: "Project Team", type: "decision", risk: "high", desc: "If BOM aligns, proceed. If not, determine whether order restart or additional procurement case is required.", x: 70, y: 385 },
    { id: "restart_decision", num: "4A", title: "New order needed?", owner: "Project Team + Presales", type: "decision", risk: "medium", desc: "Decision point for whether scope variance requires Presales to restart ordering or whether a procurement case can cover the gap.", x: -150, y: 385 },
    { id: "restart", num: "4B", title: "Presales restart ordering", owner: "Presales", type: "task", risk: "high", desc: "Presales restarts the order when the commercial scope must change before procurement can continue.", x: -150, y: 240 },
    { id: "case", num: "4C", title: "Create additional procurement case", owner: "Project Team", type: "task", risk: "medium", desc: "A separate procurement case is created when additional hardware is needed without requiring full commercial order restart.", x: -150, y: 525 },
    { id: "quote_req", num: "5", title: "Request supplier quotes", owner: "Procurement", type: "task", risk: "medium", desc: "Approved suppliers are asked for price, availability, and lead time.", x: 70, y: 525 },
    { id: "quote_val", num: "6", title: "Validate quotes", owner: "Project Team", type: "task", risk: "high", desc: "Project team confirms supplier quote matches the approved scope and technical requirements.", x: 70, y: 650 },
    { id: "quote_decision", num: "6A", title: "Quotes align with scope?", owner: "Project Team", type: "decision", risk: "high", desc: "Reject and rework any quote that misses required model, quantity, ETA, support, warranty, or accessory requirements.", x: 330, y: 650 },
    { id: "prpo", num: "7", title: "Submit PR / PO request", owner: "Vendor Management", type: "task", risk: "medium", desc: "Vendor Management submits PR/PO and manages supplier acknowledgement.", x: 560, y: 525 },
    { id: "eta", num: "8", title: "Supplier ETA confirmed", owner: "Supplier + Vendor Management", type: "task", risk: "high", desc: "Supplier provides ETA. Vendor Management tracks acknowledgement, lead time, and delivery risk against the installation window.", x: 560, y: 390 },
    { id: "ticket", num: "8A", title: "Create inbound shipment ticket", owner: "Vendor Management", type: "task", risk: "medium", desc: "Vendor Management creates the inbound shipment ticket so receiving teams have visibility before hardware arrives.", x: 560, y: 255 },
    { id: "receive", num: "9", title: "Receive shipment and update ticket", owner: "IBX Team", type: "task", risk: "medium", desc: "IBX receives shipment, verifies delivery, and updates the receiving ticket.", x: 800, y: 255 },
    { id: "pickup", num: "10", title: "Project pickup for installation", owner: "Project Team", type: "task", risk: "medium", desc: "Project team picks up hardware for installation and confirms installation readiness.", x: 800, y: 390 },
    { id: "close", num: "10A", title: "Close internal case", owner: "Vendor Management", type: "task", risk: "low", desc: "Vendor Management confirms completion and closes the internal case after hardware handoff is complete.", x: 800, y: 525 },
    { id: "end", num: "END", title: "Procurement flow complete", owner: "Project Team + VM", type: "end", risk: "low", desc: "Hardware is received, ready for installation, and the internal procurement case is closed.", x: 800, y: 650 }
  ],
  edges: [
    ["start", "config", ""], ["config", "bom", ""], ["bom", "scope", ""], ["scope", "quote_req", "YES"],
    ["scope", "restart_decision", "NO"], ["restart_decision", "restart", "YES"], ["restart", "start", "rebook"],
    ["restart_decision", "case", "NO"], ["case", "quote_req", ""], ["quote_req", "quote_val", ""],
    ["quote_val", "quote_decision", ""], ["quote_decision", "quote_req", "NO"], ["quote_decision", "prpo", "YES"],
    ["prpo", "eta", ""], ["eta", "ticket", ""], ["ticket", "receive", ""], ["receive", "pickup", ""],
    ["pickup", "close", ""], ["close", "end", ""]
  ],
  ownerRoles: {
    "Presales": { role: "Own order accuracy, scope translation, BOM creation, and order configuration.", done: "Booked order and BOM accurately reflect approved customer scope." },
    "Project Team": { role: "Own BOM review, scope validation, quote approval, pickup, and installation readiness.", done: "Hardware is technically correct, available, and ready for installation." },
    "Procurement": { role: "Own supplier engagement, quote collection, price sourcing, and lead-time sourcing.", done: "Valid supplier quote package is available for project validation." },
    "Vendor Management": { role: "Own PR/PO execution, ETA tracking, inbound ticket creation, and case closure.", done: "PO is acknowledged, shipment is tracked, and internal case is closed." },
    "IBX Team": { role: "Own receiving, delivery verification, and secure staging.", done: "Shipment is received, verified, and available for project pickup." },
    "Supplier + Vendor Management": { role: "Confirm supplier ETA and manage delivery risk against the installation window.", done: "Delivery date is acknowledged, tracked, and escalated if at risk." },
    "Project Team + Presales": { role: "Jointly determine whether scope variance needs a commercial order restart.", done: "Restart decision is documented and routed to the correct next step." },
    "Project Team + VM": { role: "Joint accountability for final handoff completeness and internal closure readiness.", done: "Hardware handoff is complete and closure evidence is documented." }
  }
};
