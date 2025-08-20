function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

function fmtMemory(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

module.exports = { fmtUptime, fmtMemory };
