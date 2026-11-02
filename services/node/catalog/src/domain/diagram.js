'use strict';

function safeLabel(value) {
  return String(value || '')
    .replace(/\\/g, ' ')
    .replace(/"/g, "'")
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

function typeLabel(nodeType) {
  const type = String(nodeType || '');
  const index = type.lastIndexOf('.');
  return index >= 0 ? type.slice(index + 1) : type || 'unknown';
}

function styleFor(nodeType) {
  const lowered = String(nodeType || '').toLowerCase();
  if (['trigger', 'webhook', 'cron', 'schedule'].some((token) => lowered.includes(token))) {
    return 'fill:#b3e0ff,stroke:#0066cc';
  }
  if (['if', 'switch', 'filter'].some((token) => lowered.includes(token))) {
    return 'fill:#ffffb3,stroke:#e6e600';
  }
  if (['function', 'code', 'set'].some((token) => lowered.includes(token))) {
    return 'fill:#d9b3ff,stroke:#6600cc';
  }
  if (lowered.includes('error')) return 'fill:#ffb3b3,stroke:#cc0000';
  return 'fill:#d9d9d9,stroke:#666666';
}

function generateMermaid(nodes, connections) {
  const list = Array.isArray(nodes) ? nodes : [];
  if (!list.length) return 'graph TD\n  EmptyWorkflow["No nodes found in workflow"]';

  const ids = new Map();
  const lines = ['graph TD'];

  list.forEach((node, index) => {
    const name = String(node.name || `Node ${index}`);
    const nodeId = `node${index}`;
    if (!ids.has(name)) ids.set(name, nodeId);
    const type = typeLabel(node.type);
    lines.push(`  ${nodeId}["${safeLabel(name)}<br>(${safeLabel(type)})"]`);
    lines.push(`  style ${nodeId} ${styleFor(type)}`);
  });

  for (const [sourceName, outputs] of Object.entries(connections || {})) {
    const sourceId = ids.get(sourceName);
    if (!sourceId || !outputs || typeof outputs !== 'object') continue;
    const main = outputs.main;
    if (!Array.isArray(main)) continue;

    const multipleOutputs = main.length > 1;
    main.forEach((targets, outputIndex) => {
      if (!Array.isArray(targets)) return;
      for (const connection of targets) {
        if (!connection || typeof connection !== 'object') continue;
        const targetId = ids.get(connection.node);
        if (!targetId) continue;
        lines.push(
          multipleOutputs
            ? `  ${sourceId} -->|${outputIndex}| ${targetId}`
            : `  ${sourceId} --> ${targetId}`
        );
      }
    });
  }

  return lines.join('\n');
}

module.exports = { generateMermaid };
