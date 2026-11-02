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
  // n8n-canvas-like palette: colored by node category, white/dark text for contrast.
  const lowered = String(nodeType || '').toLowerCase();
  if (['trigger', 'webhook', 'cron', 'schedule'].some((token) => lowered.includes(token))) {
    return 'fill:#2BD17E,stroke:#17A860,stroke-width:2px,color:#05211A';
  }
  if (['if', 'switch', 'filter'].some((token) => lowered.includes(token))) {
    return 'fill:#FFB454,stroke:#C97E1F,stroke-width:2px,color:#2B1C00';
  }
  if (['function', 'code', 'set', 'langchain', 'agent'].some((token) => lowered.includes(token))) {
    return 'fill:#B98EFF,stroke:#7C4FDB,stroke-width:2px,color:#1A0B33';
  }
  if (['http', 'request'].some((token) => lowered.includes(token))) {
    return 'fill:#FF9F5C,stroke:#CC6B22,stroke-width:2px,color:#2B1500';
  }
  if (lowered.includes('error')) return 'fill:#FF5C5C,stroke:#CC2E2E,stroke-width:2px,color:#2B0000';
  return 'fill:#1B232D,stroke:#3B4A5A,stroke-width:2px,color:#E6EDF3';
}

function generateMermaid(nodes, connections) {
  const list = Array.isArray(nodes) ? nodes : [];
  if (!list.length) return 'graph LR\n  EmptyWorkflow("No nodes found in workflow")';

  const ids = new Map();
  const lines = ['graph LR'];

  list.forEach((node, index) => {
    const name = String(node.name || `Node ${index}`);
    const nodeId = `node${index}`;
    if (!ids.has(name)) ids.set(name, nodeId);
    const type = typeLabel(node.type);
    lines.push(`  ${nodeId}("${safeLabel(name)}<br>(${safeLabel(type)})")`);
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
