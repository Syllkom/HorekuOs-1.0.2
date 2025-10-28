export default async ({ m, sock }) => {
    m.body = m.body ?? m.content.text;

    m.tag = m.body ?
        (m.body.match(/tag=[^ ]+/g) || [])
            .map(tag => tag.split('=')[1]) : [];

    m.body = m.tag.length > 0
        ? m.body.replace(/tag=[^\s]+/g, '')
            .replace(/\s+/g, ' ').trim() : m.body || '';

    m.args = m.body.trim().split(/ +/).slice(1)
    m.text = m.args.length > 0 ? m.args.join(" ") : m.body;

    if (global.settings.mainBotPrefix) {

        m.command = m.body.substring(1).trim()
            .split(/ +/)[0].toLowerCase()

        const plugin = await sock.plugins.get({
            case: m.command,
            usePrefix: true,
            command: true,
        })

        m.isCmd = plugin[0] ? true : false;
        m.plugin = plugin[0] ?? null;

        if (!m.isCmd) {
            m.command = m.body.trim()
                .split(/ +/)[0].toLowerCase()

            const plugin = await sock.plugins.get({
                case: m.command,
                usePrefix: false,
                command: true,
            })
            m.isCmd = plugin[0] ? true : false;
            m.plugin = plugin[0] ?? null;
        }
    } else {
        m.command = m.body.trim()
            .split(/ +/)[0].toLowerCase()
        const plugin = await sock.plugins.get({
            case: m.command,
            command: true
        })
        m.isCmd = plugin[0] ? true : false;
        m.plugin = plugin[0] ?? null;
    }
}