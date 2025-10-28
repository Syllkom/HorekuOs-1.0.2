import util from 'util';
import moment from 'moment-timezone';
import chalk from 'chalk';

// libreria
import $console from '../funs/fun.p.logger.js';

const m_assign = await import(`./m.assign.js?update=${Date.now()}`);
const cache = await import(`./m.cache.js?update=${Date.now()}`);
const m_Bot = await import(`./m.bot.js?update=${Date.now()}`);
const m_Chat = await import(`./m.chat.js?update=${Date.now()}`);
const m_Sender = await import(`./m.sender.js?update=${Date.now()}`);
const m_Content = await import(`./m.content.js?update=${Date.now()}`);
const m_QuotedSender = await import(`./m.quoted.sender.js?update=${Date.now()}`);
const m_ChatGroup = await import(`./m.chat.group.js?update=${Date.now()}`);
const m_PreParser = await import(`./m.pre.parser.js?update=${Date.now()}`);
const m_Parser = await import(`./m.parser.js?update=${Date.now()}`);

export default async (messages, sock) => {
    const cached = cache.default({ sock })

    for (const message of messages.messages) {
        if (!message.key) continue;

        const m = { id: message.key.id }

        // message content
        const {
            contextInfo, messageExtractors, quotedMessage
        } = await m_Content.default({ m, sock, cached, message })

        // m
        await m_Bot.default({ m, sock, cached, message, contextInfo })
        await m_Chat.default({ m, sock, cached, message, contextInfo })
        await m_Sender.default({ m, sock, cached, message, contextInfo })

        // quoted
        if (contextInfo.quotedMessage) {
            await m_QuotedSender.default({ m, sock, cached, quotedMessage })
        }

        await m_assign.default({ m, sock });

        // index: 1
        try {
            let control = { end: false };
            const plugins = await sock.plugins.get({
                before: true, index: 1
            });
            for (let plugin of plugins) {
                if (control.end) break;
                await plugin.script(m, {
                    sock: sock,
                    plugin: sock.plugins,
                    store: sock.store,
                    control: control
                });
            }
            if (control.end) return;
        } catch (e) {
            $console.error(e);
        }

        //LEER MENSAJE DESDE EL BOT
        if (!sock.subBot && global.settings['mainBotAuto-read'])
            await sock.readMessages([message.key])

        // chat grupo
        if (m.chat.isGroup) await m_ChatGroup.default({ m, sock, cached })

        if (message.messageStubType) {
            const even = $proto?.WebMessageInfo?.StubType
            const evento = Object.keys(even).find(key =>
                even[key] === message.messageStubType)
            const plugins = await sock.plugins.get({
                case: evento,
                stubtype: true
            })
            if (plugins[0]) await plugins[0].script(m, {
                parameters: message.messageStubParameters,
                plugin: sock.plugins,
                store: sock.store,
                even: evento,
                sock: sock,
            })
            else {
                $console.log(chalk.white('['),
                    chalk.magenta(moment().tz(Intl.DateTimeFormat()
                        .resolvedOptions().timeZone).format('HH:mm:ss')).trim(),
                    chalk.white(']'), chalk.blue('STUBTYPE:'),
                    chalk.rgb(0, 217, 255).underline(JSON.stringify({
                        even: evento, parameters: message.messageStubParameters
                    }, 0, 2)))
                continue;
            }

            if (plugins[0]) continue;
        }

        // index: 2
        try {
            let control = { end: false };
            const plugins = await sock.plugins.get({
                before: true, index: 2
            });
            for (let plugin of plugins) {
                if (control.end) break;
                await plugin.script(m, {
                    sock: sock,
                    plugin: sock.plugins,
                    store: sock.store,
                    control: control
                });
            }
            if (control.end) return;
        } catch (e) {
            $console.error(e);
        }

        if (!message.message) continue;
        if (!message.message[m.type]) m.type = [0, Object.keys(message.message)[0]]

        $console.log(chalk.white('['), chalk.magenta(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('HH:mm:ss')).trim(), chalk.white(']'), chalk.blue(`MENSAJE:`), chalk.green('{'), chalk.rgb(255, 131, 0).underline(m.content.text == '' ? m.type[1] + '' : m.content.text), chalk.green('}'), chalk.blue('De'), chalk.cyan(m.sender.name), 'Chat', m.chat.isGroup ? chalk.bgGreen('grupo:' + (m.chat.name || m.chat.id)) : chalk.bgRed('Privado:' + m.sender.role('bot') ? 'bot' : m.sender.name || m.sender.id))

        if (m.content.text == '.m') {
            return await m.reply(String(JSON.stringify(m, 0, 2)))
        }

        if (!m.type[0]) continue;

        m.body = m.content.text;
       
        if (m.quoted && m.content.text) await m_PreParser.default({ m, sock, message, contextInfo })

        await m_Parser.default({ m, sock })

        if (m.content.text == '.m') {
            return await m.reply(String(JSON.stringify(m, 0, 2)))
        }

        // index: 3
        try {
            let control = { end: false };
            const plugins = await sock.plugins.get({
                before: true, index: 3
            });
            for (let plugin of plugins) {
                if (control.end) break;
                await plugin.script(m, {
                    sock: sock,
                    plugin: sock.plugins,
                    store: sock.store,
                    control: control
                });
            }
            if (control.end) return;
        } catch (e) {
            $console.error(e);
        }

        m.message = message

        try {
            if (m.plugin) return await m
                .plugin.script(m, {
                    plugin: sock.plugins,
                    store: sock.store,
                    sock: sock,
                })
        } catch (e) {
            $console.log(chalk.white('['), chalk.redBright('ERROR'), chalk.white(']'), chalk.redBright('Error:'), util.format(e))
            await m.react('error')
            await sock.sendMessage(m.chat.id, { text: (`*[ Evento - ERROR ]*\n\n- Comando:* ${global.prefix + m.command}\n- Usuario:* wa.me/${m.sender.number}\n- Chat:* ${m.chat.id}\n${global.readMore}\n*\`[ERORR]\`:* ${util.format(e)}\n`) }, { quoted: m.message })
            continue
        }
    }
};