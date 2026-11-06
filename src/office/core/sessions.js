// The sessions the server reports (id -> session) and how they are named and coloured on screen.
const PALETTE = ['#6A8042', '#E8742A', '#3F7CC4', '#8C4FA8', '#D64550', '#2A9D8F', '#C9A227', '#5B6CD8', '#B5651D', '#C2577A', '#3E8E7E', '#7A6FD0'];
export const sessions = new Map();  // session id -> latest session object from the server
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export const colorOf = (s) => PALETTE[hash(s.name) % PALETTE.length];
// What to call a session on screen: the chat's title (your rename, else Claude's), else its short name.
// The short name stays the identity: colours are keyed by it.
export const dn = (s) => (s ? s.title || s.name : '');
