// /plugins/kick.js
export default {
    command: true,
    usePrefix: true,
    case: 'kick',
    script: async (m, { sock }) => {
        // Validaciones
        if (!m.chat.group) return m.sms('group');
        if (!m.sender.admin) return m.sms('admin');
        if (!m.bot.admin) return m.sms('botAdmin');

        const user = m.quoted ? m.quoted?.sender.id : m.sender?.mentioned
        if (!user) return m.reply('Debes mencionar a alguien o responder a su mensaje para expulsarlo.');

        try {
            await sock.groupParticipantsUpdate(m.chat.id, [user], 'remove')
            await m.reply(`✅ Usuario expulsado.`);
        } catch (e) {
            await m.reply(`❌ No se pudo expulsar al usuario.`);
            console.error(e);
        }
    }
};