import $base from '../funs/fun.makeDBase.js';
const userRoles = global.settings.SetUserRoles

export default async ({ m, cached, message }) => {
    m.sender = m.sender || {}
    m.sender.roles = {}
    m.sender.id = m.bot.fromMe ? m.bot.id : (message.key.remoteJid.endsWith('@s.whatsapp.net')
        ? message.key.remoteJid : message.key.participantPn ?? message.key.participant);
    m.sender.name = m.bot.fromMe ? m.bot.name : message.pushName || '';
    m.sender.number = (m.sender.id)?.split('@')[0] || undefined;
    m.sender.roles.bot = m.bot.id === m.sender.id;

    m.sender.getDesc = async () => await cached.sender.desc(m.sender.id);
    m.sender.getPhoto = async () => await cached.sender.photo(m.sender.id, 'image')
    m.sender.role = async (...array) => array.some(role => m.sender.roles[role]);


    // store
    const db = await $base.open('system:BUC')
    if (!db.data['@users']) db.data['@users'] = {}
    const roles = userRoles[m.sender.number]
    const users = db.data['@users']

    const rol = {
        rowner: m.sender.roles.bot ? true
            : roles?.rowner || false,
        owner: m.sender.roles.bot ? true
            : roles?.owner || false,
        modr: m.sender.roles.bot ? true
            : roles?.modr || false,
        prem: m.sender.roles.bot ? true
            : roles?.prem || false,
    }

    if (!users[m.sender.id]) {
        users[m.sender.id] = {
            name: m.sender.name,
            banned: false,
            roles: rol
        }
    }

    if (roles) users[m.sender.id].roles = {
        ...users[m.sender.id].roles,
        ...roles
    }

    Object.assign(m.sender.roles,
        structuredClone({
            ...users[m.sender.id].roles
        }))

    await db.update()
}