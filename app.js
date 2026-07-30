(() => {
  "use strict";

  const { nodes, edges, ownerRoles } = window.PROCESS_DATA;
  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const riskColor = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
  const risks = {
    low: "Normal governance risk. Keep standard handoff evidence and case notes current.",
    medium: "Watch for handoff lag, missing ticket updates, lead-time variance, or unclear ownership.",
    high: "Potential schedule exposure. Validate scope, ETA, technical fit, and escalation path before proceeding."
  };

  const dom = {
    nodeLayer: document.getElementById("nodes"),
    edgeLayer: document.getElementById("edges"),
    panel: document.getElementById("detailPanel"),
    tip: document.getElementById("tooltip"),
    ownerFilter: document.getElementById("ownerFilter"),
    btnAll: document.getElementById("btnAll"),
    btnCritical: document.getElementById("btnCritical"),
    btnDecisions: document.getElementById("btnDecisions"),
    btnReset: document.getElementById("btnReset")
  };

  let selected = null;
  let mode = "all";
  let ownerFilter = "all";

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wrapText(text, maxChars) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      if ((`${line} ${word}`).trim().length > maxChars) {
        lines.push(line);
        line = word;
      } else {
        line = (`${line} ${word}`).trim();
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function dimensions(node) {
    return { width: 190, height: node.type === "decision" ? 100 : 70 };
  }

  function makePath(a, b) {
    const boxW = 190;
    const boxH = 70;
    const diamondH = 100;
    const aCx = a.x + 95;
    const aCy = a.y + (a.type === "decision" ? 50 : 35);
    const bCx = b.x + 95;
    const bCy = b.y + (b.type === "decision" ? 50 : 35);
    const dx = bCx - aCx;
    const dy = bCy - aCy;

    if (a.id === "restart" && b.id === "start") {
      const sx = a.x + 95;
      const sy = a.y - 8;
      const ex = b.x;
      const ey = b.y + 35;
      const midX = ex - 55;
      return `M ${sx} ${sy} L ${sx} ${ey} L ${midX} ${ey} L ${ex} ${ey}`;
    }

    if (a.id === "quote_val" && b.id === "quote_decision") {
      const sx = a.x + boxW + 8;
      const sy = a.y + boxH - 8;
      const ex = b.x + 95;
      const ey = b.y + diamondH + 2;
      const midX = sx + 70;
      const midY = Math.min(ey + 16, 768);
      return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${midY} L ${ex} ${midY} L ${ex} ${ey}`;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      const sx = dx > 0 ? a.x + boxW + 8 : a.x - 8;
      const sy = aCy;
      const ex = dx > 0 ? b.x - 8 : b.x + boxW + 8;
      const ey = bCy;
      const midX = sx + (ex - sx) / 2;
      return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`;
    }

    const aBottom = a.y + (a.type === "decision" ? diamondH : boxH) + 8;
    const aTop = a.y - 8;
    const bTop = b.y - 8;
    const bBottom = b.y + (b.type === "decision" ? diamondH : boxH) + 8;
    const sx = aCx;
    const sy = dy > 0 ? aBottom : aTop;
    const ex = bCx;
    const ey = dy > 0 ? bTop : bBottom;
    const midY = sy + (ey - sy) / 2;
    return `M ${sx} ${sy} L ${sx} ${midY} L ${ex} ${midY} L ${ex} ${ey}`;
  }

  function labelPosition(a, b, index) {
    const custom = {
      "scope|quote_req": [150, 468],
      "scope|restart_decision": [-65, 430],
      "restart_decision|restart": [-48, 322],
      "restart|start": [-18, 115],
      "restart_decision|case": [-48, 505],
      "quote_decision|quote_req": [245, 575],
      "quote_decision|prpo": [465, 635]
    };
    return custom[`${a.id}|${b.id}`] || [(a.x + b.x) / 2 + 72, (a.y + b.y) / 2 + 12 + (index % 2) * 4];
  }

  function drawEdges() {
    dom.edgeLayer.innerHTML = "";
    edges.forEach(([from, to, label], index) => {
      const a = nodeById[from];
      const b = nodeById[to];
      const path = svgEl("path", { d: makePath(a, b), class: "edge", "data-from": from, "data-to": to, id: `edge-${index}` });
      dom.edgeLayer.appendChild(path);
      if (label) {
        const [x, y] = labelPosition(a, b, index);
        const text = svgEl("text", { class: "edge-label", x, y });
        text.textContent = label;
        dom.edgeLayer.appendChild(text);
      }
    });
  }

  function drawNodes() {
    dom.nodeLayer.innerHTML = "";
    nodes.forEach((node) => {
      const group = svgEl("g", { class: "node", "data-id": node.id, transform: `translate(${node.x},${node.y})`, tabindex: "0", role: "button", "aria-label": `${node.num}. ${node.title}. Owner ${node.owner}. ${riskText(node.risk)}.` });
      const fill = node.type === "decision" ? "#faf5ff" : node.type === "start" || node.type === "end" ? "#ecfdf5" : "#ffffff";
      const stroke = node.type === "decision" ? "#7c3aed" : "#cbd5e1";

      if (node.type === "decision") {
        group.appendChild(svgEl("polygon", { points: "95,0 190,50 95,100 0,50", fill, stroke, "stroke-width": "2" }));
      } else if (node.type === "start" || node.type === "end") {
        group.appendChild(svgEl("ellipse", { cx: "95", cy: "35", rx: "92", ry: "35", fill, stroke, "stroke-width": "2" }));
      } else {
        group.appendChild(svgEl("rect", { width: "190", height: "70", rx: "15", fill, stroke, "stroke-width": "2" }));
      }

      group.appendChild(svgEl("circle", { cx: "18", cy: "18", r: "15", fill: riskColor[node.risk] }));
      const num = svgEl("text", { x: "18", y: "22", "text-anchor": "middle", class: "node-num" });
      num.textContent = node.num;
      group.appendChild(num);

      wrapText(node.title, 22).forEach((line, idx) => {
        const title = svgEl("text", { x: "95", y: node.type === "decision" ? 39 + idx * 15 : 31 + idx * 15, "text-anchor": "middle", class: node.type === "decision" ? "decision-title" : "node-title" });
        title.textContent = line;
        group.appendChild(title);
      });

      const meta = svgEl("text", { x: "95", y: node.type === "decision" ? 78 : 62, "text-anchor": "middle", class: "node-meta" });
      meta.textContent = node.owner;
      group.appendChild(meta);

      group.addEventListener("mouseenter", (event) => previewNode(event, node));
      group.addEventListener("mousemove", moveTip);
      group.addEventListener("mouseleave", clearPreview);
      group.addEventListener("focus", (event) => previewNode(event, node));
      group.addEventListener("blur", clearPreview);
      group.addEventListener("click", () => toggleSelection(node.id));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleSelection(node.id);
        }
      });

      dom.nodeLayer.appendChild(group);
    });
  }

  function previewNode(event, node) {
    showTip(event, node);
    updatePanel(node, false);
    highlight(node.id);
  }

  function clearPreview() {
    dom.tip.style.display = "none";
    if (selected) {
      highlight(selected);
      updatePanel(nodeById[selected], true);
      return;
    }
    clearHighlight();
    resetPanel();
  }

  function toggleSelection(id) {
    selected = selected === id ? null : id;
    if (selected) {
      highlight(selected);
      updatePanel(nodeById[selected], true);
    } else {
      clearHighlight();
      resetPanel();
    }
  }

  function riskText(risk) {
    return `${risk[0].toUpperCase()}${risk.slice(1)} risk`;
  }

  function ownerDirectoryHtml() {
    const options = Object.keys(ownerRoles).map((owner) => `<option>${escapeHtml(owner)}</option>`).join("");
    return `<div class="detail-card"><h3>Owner Directory</h3><label class="field-label" for="roleSelector">Choose owner</label><select id="roleSelector"><option value="">Select owner...</option>${options}</select><div id="roleDetails" class="role-details"></div></div>`;
  }

  function updatePanel(node, locked) {
    const connectedItems = connected(node.id).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    dom.panel.innerHTML = `
      <h2>${escapeHtml(node.title)}</h2>
      <div class="owner">Owner: ${escapeHtml(node.owner)} ${locked ? "• locked" : ""}</div>
      <div class="detail-card"><h3>Task description</h3><p>${escapeHtml(node.desc)}</p></div>
      <div class="detail-card"><h3>Potential risk</h3><span class="risk-pill ${node.risk}"><i class="dot" style="background:${riskColor[node.risk]}"></i>${riskText(node.risk)}</span><p>${risks[node.risk]}</p></div>
      <div class="detail-card"><h3>Connected handoffs</h3><ul>${connectedItems}</ul></div>
      ${ownerDirectoryHtml()}
    `;
    bindOwnerDirectory();
  }

  function resetPanel() {
    dom.panel.innerHTML = `
      <h2>Select a task</h2>
      <div class="owner">Hover, focus, or click a process box</div>
      <div class="detail-card"><h3>How to use</h3><p>Move the cursor over a task, or tab to it, to preview description, owner, and risk. Click or press Enter to lock the detail view and highlight connected dependencies.</p></div>
      ${ownerDirectoryHtml()}
      <div class="detail-card"><h3>Operating rule</h3><p>Do not submit PR/PO until both BOM scope and quote scope are explicitly validated by the Project Team.</p></div>
    `;
    bindOwnerDirectory();
  }

  function connected(id) {
    const items = [];
    edges.forEach(([from, to, label]) => {
      if (from === id) items.push(`Next: ${nodeById[to].title}${label ? ` (${label})` : ""}`);
      if (to === id) items.push(`Previous: ${nodeById[from].title}${label ? ` (${label})` : ""}`);
    });
    return items.length ? items : ["No direct dependencies."];
  }

  function showTip(event, node) {
    dom.tip.innerHTML = `<b>${escapeHtml(node.title)}</b><span>Owner: ${escapeHtml(node.owner)} • ${riskText(node.risk)}</span><br>${escapeHtml(node.desc)}`;
    dom.tip.style.display = "block";
    moveTip(event);
  }

  function moveTip(event) {
    const x = event.clientX || 24;
    const y = event.clientY || 24;
    dom.tip.style.left = `${x + 18}px`;
    dom.tip.style.top = `${y + 18}px`;
  }

  function clearHighlight() {
    document.querySelectorAll(".node,.edge").forEach((el) => el.classList.remove("dim", "highlight", "selected", "hidden-by-filter"));
    applyMode();
    applyOwnerFilter();
  }

  function highlight(id) {
    document.querySelectorAll(".node,.edge").forEach((el) => {
      el.classList.add("dim");
      el.classList.remove("highlight", "selected");
    });
    const current = document.querySelector(`.node[data-id="${id}"]`);
    current?.classList.add("selected");
    current?.classList.remove("dim");

    edges.forEach(([from, to]) => {
      if (from === id || to === id) {
        document.querySelector(`.node[data-id="${from}"]`)?.classList.remove("dim");
        document.querySelector(`.node[data-id="${to}"]`)?.classList.remove("dim");
        document.querySelectorAll(`.edge[data-from="${from}"][data-to="${to}"]`).forEach((edge) => {
          edge.classList.remove("dim");
          edge.classList.add("highlight");
        });
      }
    });
  }

  function setMode(nextMode, activeButton) {
    mode = nextMode;
    selected = null;
    setActive(activeButton);
    clearHighlight();
    resetPanel();
  }

  function setActive(activeButton) {
    [dom.btnAll, dom.btnCritical, dom.btnDecisions].forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function applyMode() {
    if (mode === "critical") {
      const critical = new Set(["start", "config", "bom", "scope", "quote_req", "quote_val", "quote_decision", "prpo", "eta", "ticket", "receive", "pickup", "close", "end"]);
      document.querySelectorAll(".node").forEach((group) => {
        if (!critical.has(group.dataset.id)) group.classList.add("dim");
      });
    }
    if (mode === "decisions") {
      document.querySelectorAll(".node").forEach((group) => {
        if (nodeById[group.dataset.id].type !== "decision") group.classList.add("dim");
      });
    }
  }

  function applyOwnerFilter() {
    if (ownerFilter === "all") return;
    document.querySelectorAll(".node").forEach((group) => {
      if (nodeById[group.dataset.id].owner !== ownerFilter) group.classList.add("hidden-by-filter");
    });
  }

  function bindOwnerDirectory() {
    const selector = document.getElementById("roleSelector");
    const details = document.getElementById("roleDetails");
    if (!selector || !details) return;
    selector.addEventListener("change", () => {
      const role = ownerRoles[selector.value];
      details.innerHTML = role ? `<p><b>Role description</b><br>${escapeHtml(role.role)}</p><p><b>Responsibilities / Definition of Done</b><br>${escapeHtml(role.done)}</p>` : "";
    });
  }

  function populateOwnerFilter() {
    const owners = Array.from(new Set(nodes.map((node) => node.owner))).sort();
    owners.forEach((owner) => {
      const option = document.createElement("option");
      option.value = owner;
      option.textContent = owner;
      dom.ownerFilter.appendChild(option);
    });
  }

  function bindControls() {
    dom.btnAll.addEventListener("click", () => setMode("all", dom.btnAll));
    dom.btnCritical.addEventListener("click", () => setMode("critical", dom.btnCritical));
    dom.btnDecisions.addEventListener("click", () => setMode("decisions", dom.btnDecisions));
    dom.btnReset.addEventListener("click", () => {
      selected = null;
      clearHighlight();
      resetPanel();
    });
    dom.ownerFilter.addEventListener("change", (event) => {
      ownerFilter = event.target.value;
      selected = null;
      clearHighlight();
      resetPanel();
    });
  }

  function validateData() {
    const ids = new Set(nodes.map((node) => node.id));
    const missingRefs = edges.filter(([from, to]) => !ids.has(from) || !ids.has(to));
    if (missingRefs.length) {
      console.error("Process data contains invalid edge references", missingRefs);
    }
  }

  function init() {
    validateData();
    populateOwnerFilter();
    bindControls();
    resetPanel();
    drawEdges();
    drawNodes();
  }

  init();
})();
