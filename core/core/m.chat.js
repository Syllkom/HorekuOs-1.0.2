import $base from '../funs/fun.makeDBase.js';

export default async ({ m, sock, cached, message}) => {
    m.chat = m.chat || {}
    m.chat.id = message.key.remoteJid ||
        message.key.participant
    m.chat.isGroup = m.chat.id.endsWith('@g.us')

    if (m.chat.isGroup) Object.assign(m.chat, {
        add: async (user) => await sock.groupParticipantsUpdate(m.chat.id, [user], 'add'),
        remove: async (user) => await sock.groupParticipantsUpdate(m.chat.id, [user], 'remove'),
        promote: async (user) => await sock.groupParticipantsUpdate(m.chat.id, [user], 'promote'),
        demote: async (user) => await sock.groupParticipantsUpdate(m.chat.id, [user], 'demote'),
        getPhoto: async (type = 'image', id) => await cached.group.photo(id ?? m.chat.id, type),
        setPhoto: async (image) => await sock.updateProfilePicture(m.chat.id, image),
        setDesc: async (desc) => await sock.groupUpdateDescription(m.chat.id, desc),
        setName: async (name) => await sock.groupUpdateSubject(m.chat.id, name),
        getCodeInvite: async () => await cached.group.inviteCode(m.chat.id),
        getLinkInvite: async () => await cached.group.inviteLink(m.chat.id),
        revoke: async () => await sock.groupRevokeInvite(m.chat.id),

        settings: {
            lock: async (bool) => await sock.groupSettingUpdate(m.chat.id, bool ? 'locked' : 'unlocked'),
            announce: async (bool) => await sock.groupSettingUpdate(m.chat.id, bool ? 'announcement' : 'not_announcement'),
            memberAdd: async (bool) => await sock.groupSettingUpdate(m.chat.id, bool ? 'all_member_add' : 'admin_add'),
            joinApproval: async (bool) => await sock.groupJoinApprovalMode(m.chat.id, bool ? 'on' : 'off'),
        },
    })

    else {
        m.chat.getDesc = async () => await cached.sender.desc(m.chat.id);
        m.chat.getPhoto = async () => await cached.sender.photo(m.chat.id, 'image')
    }

    const db = await $base.open('system:BUC')

    // Asignar chat
    if (!db.data['@chats']) db.data['@chats'] = {}
    if (!db.data['@chats'][m.chat.id])
        db.data['@chats'][m.chat.id] = {
            banned: false
        }

    await db.update()
}