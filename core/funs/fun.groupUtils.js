// folder: core/funs/fun.groupUtils.js

function isJidGroup(jid) { return typeof jid === 'string' && jid.endsWith('@g.us') }

function formatMention(jid) { return typeof jid === 'string' ? jid.split('@')[0] : '' }

function buildWelcomeMessage({ userJid, groupName, membersCount }) {
  const user = formatMention(userJid)
  return `👋 Bienvenid@ @${user}\nA: *${groupName}*\nMiembros: ${membersCount}`
}

function buildGoodbyeMessage({ userJid, groupName, membersCount }) {
  const user = formatMention(userJid)
  return `👋 Adiós @${user}\nDe: *${groupName}*\nQuedan: ${membersCount}`
}

function detectWhatsAppLinks(text) {
  if (!text) return []
  const regex = /(https?:\/\/)?(chat\.whatsapp\.com\/[A-Za-z0-9]{22,}|wa\.me\/[0-9]+|api\.whatsapp\.com\/send\?phone=\d+)/gi
  const matches = text.match(regex) || []
  return matches
}

export async function getGroupMetadata(sock, jid) {
  if (!isJidGroup(jid)) throw new Error('JID no es de grupo')
  const md = await sock.groupMetadata(jid)
  return md // { id, subject, desc, participants, ... }
}

export async function getGroupDescription(sock, jid) {
  const md = await getGroupMetadata(sock, jid)
  return md?.desc || ''
}

export async function setGroupSubject(sock, jid, subject) {
  if (!subject || !subject.trim()) throw new Error('subject vacío')
  return sock.groupUpdateSubject(jid, subject)
}

export async function getGroupSubject(sock, jid) {
  const md = await getGroupMetadata(sock, jid)
  return md?.subject || ''
}

export async function getGroupPicture(sock, jid) {
  try { return await sock.profilePictureUrl(jid, 'image') } catch { return null }
}

export async function getUserPicture(sock, jid) {
  try { return await sock.profilePictureUrl(jid, 'image') } catch { return null }
}

export async function groupClose(sock, jid) { return sock.groupSettingUpdate(jid, 'announcement') }
export async function groupOpen(sock, jid) { return sock.groupSettingUpdate(jid, 'not_announcement') }

export async function groupRemove(sock, jid, users) {
  const arr = Array.isArray(users) ? users : [users].filter(Boolean)
  if (!arr.length) throw new Error('sin usuarios')
  return sock.groupParticipantsUpdate(jid, arr, 'remove')
}

export async function groupPromote(sock, jid, users) {
  const arr = Array.isArray(users) ? users : [users].filter(Boolean)
  if (!arr.length) throw new Error('sin usuarios')
  return sock.groupParticipantsUpdate(jid, arr, 'promote')
}

export async function groupDemote(sock, jid, users) {
  const arr = Array.isArray(users) ? users : [users].filter(Boolean)
  if (!arr.length) throw new Error('sin usuarios')
  return sock.groupParticipantsUpdate(jid, arr, 'demote')
}

export async function sendWelcome(sock, { jid, userJid, quoted }) {
  const md = await getGroupMetadata(sock, jid)
  const text = buildWelcomeMessage({ userJid, groupName: md.subject, membersCount: md.participants?.length || 0 })
  return sock.sendMessage(jid, { text, mentions: [userJid] }, quoted ? { quoted } : {})
}

export async function sendGoodbye(sock, { jid, userJid, quoted }) {
  const md = await getGroupMetadata(sock, jid)
  const text = buildGoodbyeMessage({ userJid, groupName: md.subject, membersCount: md.participants?.length || 0 })
  return sock.sendMessage(jid, { text, mentions: [userJid] }, quoted ? { quoted } : {})
}

export function checkAntiLinks({ text, allowWa = false }) {
  const links = detectWhatsAppLinks(text)
  if (!links.length) return { hasLinks: false, links: [] }
  if (allowWa) return { hasLinks: false, links: [] }
  return { hasLinks: true, links }
}

export default {
  isJidGroup,
  formatMention,
  detectWhatsAppLinks,
  getGroupMetadata,
  getGroupDescription,
  setGroupSubject,
  getGroupSubject,
  getGroupPicture,
  getUserPicture,
  groupClose,
  groupOpen,
  groupRemove,
  groupPromote,
  groupDemote,
  sendWelcome,
  sendGoodbye,
  checkAntiLinks
}
