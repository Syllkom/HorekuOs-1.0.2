import $base from '../funs/fun.makeDBase.js';

export default async ({ m, cached, quotedMessage }) => {
    const db = await $base.open('system:BUC')
    if (!db.data['@users']) db.data['@users'] = {}
    const users = db.data['@users']

    m.quoted.sender = { id: quotedMessage.key.participant }
    m.quoted.sender.roles = { ...structuredClone(users?.[m.quoted.sender.id]?.roles || {}) }
    m.quoted.sender.name = m.bot.fromMe ? m.bot.name : users?.[m.quoted.sender.id]?.name || '';
    m.quoted.sender.number = (m.quoted.sender.id)?.split('@')[0] || undefined;
    m.quoted.sender.roles.bot = m.bot.id == m.quoted.sender.id;
    m.quoted.sender.getDesc = async () => await cached.sender.desc(m.quoted.sender.id);
    m.quoted.sender.getPhoto = async () => await cached.sender.photo(m.quoted.sender.id, 'image')
    m.quoted.sender.role = async (...array) => array.some(role => m.quoted.sender.roles[role]);
}