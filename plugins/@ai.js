// folder: plugins/servicio/@ai.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const plugin = {
    case: ['ai', 'ia'],
    usage: ['.ai <tu solicitud>'],
    category: ['servicio'],
    command: true,
};

const Tools = [{
    functionDeclarations: [
        {
            name: "group_getPhoto",
            description: "Obtiene la foto de perfil actual del grupo y la envía al chat.",
            parameters: { type: "OBJECT", properties: {} }
        },
        {
            name: "user_getPhoto",
            description: "Obtiene la foto de perfil actual de un usuario y la envía al chat. El usuario objetivo se obtiene del mensaje citado o una mención (@)",
            parameters: {
                type: "OBJECT",
                properties: {
                    userId: { type: "STRING", description: "ID del usuario a obtener la foto de perfil." }
                },
                required: ["userId"]
            }
        },
        {
            name: "group_addUser",
            description: "Añade un nuevo miembro al grupo actual. El usuario a agregar se obtiene de una mención (@) en el mensaje o del mensaje citado. Solo los administradores pueden ejecutar esta acción.",
            parameters: {
                type: "OBJECT",
                properties: {
                    userId: { type: "STRING", description: "ID del usuario a añadir (por ejemplo: '+123456789')." }
                },
                required: ["userId"]
            }
        },
        {
            name: "group_removeUser",
            description: "Elimina a un miembro del grupo. El usuario objetivo se obtiene del mensaje citado o una mención (@). Solo los administradores pueden hacerlo. REGLA CRÍTICA: Si el mensaje contiene TANTO un usuario citado COMO un usuario mencionado, NO ejecutes la función. En su lugar, responde con texto preguntando al usuario a quién desea eliminar exactamente, presentando ambas opciones para que elija.",
            parameters: {
                type: "OBJECT",
                properties: {
                    userId: { type: "STRING", description: "ID del usuario a eliminar." }
                },
                required: ["userId"]
            }
        },
        {
            name: "group_promoteUser",
            description: "Otorga privilegios de administrador a un miembro del grupo. El usuario objetivo se obtiene del mensaje citado o mención (@). Solo los administradores pueden ejecutar esta acción.",
            parameters: {
                type: "OBJECT",
                properties: {
                    userId: { type: "STRING", description: "ID del usuario a promover como administrador." }
                },
                required: ["userId"]
            }
        },
        {
            name: "group_demoteUser",
            description: "Revoca los privilegios de administrador de un miembro del grupo. El usuario se obtiene del mensaje citado o mención (@). Requiere confirmación antes de proceder.",
            parameters: {
                type: "OBJECT",
                properties: {
                    userId: { type: "STRING", description: "ID del usuario a degradar de su rol de administrador." }
                },
                required: ["userId"]
            }
        },
        {
            name: "group_setPhoto",
            description: "Cambia la foto de perfil del grupo actual. Usa la imagen adjunta en el mensaje o la del mensaje citado. Solo se ejecuta si se detecta contenido multimedia válido (imagen estática o foto).",
            parameters: { type: "OBJECT", properties: {} }
        },
        {
            name: "group_setName",
            description: "Actualiza el nombre o asunto del grupo actual. Se recomienda mantenerlo breve y representativo. Solo los administradores pueden modificarlo.",
            parameters: {
                type: "OBJECT",
                properties: {
                    newName: { type: "STRING", description: "Nuevo nombre del grupo (máximo 100 caracteres)." }
                },
                required: ["newName"]
            }
        },
        {
            name: "group_setDescription",
            description: "Actualiza la descripción del grupo actual. Solo los administradores pueden cambiarla.",
            parameters: {
                type: "OBJECT",
                properties: {
                    newDescription: { type: "STRING", description: "Nueva descripción o mensaje informativo para el grupo." }
                },
                required: ["newDescription"]
            }
        },
        {
            name: "group_getInviteLink",
            description: "Obtiene y muestra el enlace actual de invitación del grupo. Solo los administradores pueden solicitarlo.",
            parameters: { type: "OBJECT", properties: {} }
        },
        {
            name: "group_revokeInviteLink",
            description: "Invalida el enlace actual de invitación y genera uno nuevo. Requiere confirmación antes de ejecutar. Solo los administradores pueden realizar esta acción.",
            parameters: { type: "OBJECT", properties: {} }
        },
        {
            name: "group_toggleAnnouncements",
            description: "Restringe o libera el envío de mensajes en el grupo. Cuando está bloqueado, solo los administradores pueden escribir.",
            parameters: {
                type: "OBJECT",
                properties: {
                    announceOnly: { type: "BOOLEAN", description: "true para activar modo anuncios, false para restaurar el chat normal." }
                },
                required: ["announceOnly"]
            }
        },
        {
            name: "bot_updateName",
            description: "Actualiza el nombre de perfil del propio bot. Solo el propietario puede cambiarlo.",
            parameters: {
                type: "OBJECT",
                properties: {
                    newName: { type: "STRING", description: "Nuevo nombre que se mostrará en el perfil del bot." }
                },
                required: ["newName"]
            }
        },
        {
            name: "bot_updateStatus",
            description: "Actualiza el texto de estado o la descripción del perfil del bot (también conocida como 'info'). Solo el propietario puede modificarlo.",
            parameters: {
                type: "OBJECT",
                properties: {
                    newStatus: { type: "STRING", description: "Nuevo texto de estado o descripción para el perfil del bot." }
                },
                required: ["newStatus"]
            }
        },
        {
            name: "bot_setPhoto",
            description: "Establece la imagen adjunta en el mensaje del usuario como la nueva foto de perfil del bot. Solo se ejecuta si se detecta una imagen válida. Esta acción solo puede realizarla el propietario.",
            parameters: { type: "OBJECT", properties: {} }
        }
    ]
}];

const systemInstruction = `
[ROL Y PERSONALIDAD]: Eres la IA de este chat. Tu personalidad es directa, ingeniosa y un poco sarcástica. No te andas con rodeos y respondes con naturalidad. Cuando la situación lo amerita (preguntas tontas, repetitivas o usuarios groseros), puedes usar un tono más picante y devolver la misma energía, pero sin ser agresiva. Tu objetivo principal es ser funcionalmente útil, pero también mantener las cosas entretenidas.

[USO INTELIGENTE DEL CONTEXTO]: En cada mensaje, recibes un bloque de [CONTEXTO] con información que los demás no ven (quién pregunta, si es admin, a quién responde, etc.). Esta es tu "información privilegiada". Úsala para hacer comentarios astutos y personalizados.
- Ejemplo 1: Si el 'Solicitante' es 'Admin' y pide algo simple, podrías decir: "Claro, jefazo. Para eso están los privilegios, ¿no?"
- Ejemplo 2: Si sabes que estás en un 'grupo', puedes hacer bromas que solo el usuario entenderá: "Ok, lo haré, pero shhh, que no se enteren los demás."
- Regla de Oro: NUNCA, bajo ninguna circunstancia, reveles que tienes acceso a este [CONTEXTO] o que es "información oculta". Simplemente actúa en base a ello. Es tu secreto.

[REGLAS DE FUNCIONAMIENTO (INNEGOCIABLES)]:
1.  **Prioriza las Herramientas**: A pesar de tu personalidad, tu primera prioridad es siempre determinar si la solicitud del usuario corresponde a una de las herramientas disponibles. Si es así, solicita la llamada a la función.
2.  **Seguridad Primero**: Para acciones sensibles (eliminar, degradar, anular link), SIEMPRE debes pedir confirmación explícita al usuario antes de llamar a la función. Aquí mantén un tono más serio. Por ejemplo: "¿Estás seguro de que quieres eliminar a esta persona? No hay vuelta atrás."
3.  **Usa el Contexto para Acciones**: Deduce el objetivo de tus acciones (a quién eliminar, promover, etc.) a partir de los datos 'Respondiendo a' y 'Usuarios mencionados'. Si no hay suficiente información, pregunta sin rodeos. Por ejemplo: "A quién exactamente quieres que elimine?"
4.  **Sé Conciso**: Mantén tus respuestas directas y al grano.
`;

plugin.script = async (m, { sock }) => {
    if (!m.text && !m.content.media) {
        return m.reply("Hola, soy tu asistente. Dime qué necesitas. Por ejemplo: `.asistente cambia el nombre del grupo a 'Nuevo Nombre'`");
    }

    await m.react('wait');

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const db = await global.$simpleDB.open('@asistente');
        if (!db.data[m.sender.id]) db.data[m.sender.id] = [];

        const genAI = new GoogleGenerativeAI("your_api_key_gemini");
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", tools: Tools,
            systemInstruction,
        });

        if (db.data[m.sender.id].length > 14) {
            let history = db.data[m.sender.id];
            let numero = history.length - 14;
            history.splice(0, numero);
        }

        const text = `
[CONTEXTO]
sender: [
 id: ${m.sender.id}
 name: ${m.sender.name}
 isAdmin: ${m.sender.roles.admin ? 'Sí' : 'No'}
 isOwner: ${m.sender.roles.rowner ? 'Sí' : 'No'}
 mentioned: ${m.sender.mentioned?.[0] ?? false}
]

chat: [
 id: ${m.chat.id}
 chat: ${m.chat.isGroup ? 'grupo' : 'privado'}
 isGroup: ${m.chat.isGroup ? 'Sí' : 'No'}
 ${m.chat.isGroup ? `
 name: ${m.chat.name}
 desc: ${m.chat.desc}
 created: ${m.chat.created}
 participants: ${m.chat.participants.length}
 Announce: ${m.chat.metaData.announce ? 'Sí' : 'No'}` : ``}
] ${m.quoted ? `\n\nquoted user: [
 id: ${m.quoted?.sender?.roles?.bot ? 'tu (' + m.quoted.sender.id + ')' : m.quoted?.sender?.id}
 name: ${m.quoted.sender.name}
 type: ${m.quoted.type}
]` : ''}

message: [
 type: ${m.content.media ? m.type.replace('Message', '').toUpperCase() : 'text'}
]

[mensaje del usuario]:
${m.text}
`

        const parts = [{ text: text }]

        const chat = model.startChat({
            history: db.data[m.sender.id],
        });

        const result = await chat.sendMessage(parts);

        const response = result.response;
        const functionCalls = response.functionCalls
            ? response.functionCalls() : null;

        if (functionCalls?.[0]) {
            let object = []

            for (const functionCall of functionCalls) {
                const { name, args } = functionCall;

                // Funciones
                switch (name) {
                    case 'user_getPhoto': {
                        object.push({ image: { url: await m.cache.sender.photo(args.userId, 'image') } })
                    } break;
                    case 'group_addUser': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')
                        const userId = (args.userId).replace(/\D/g, '') + '@s.whatsapp.net';
                        await m.chat.add(userId)
                    } break;

                    case 'group_removeUser': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        await m.chat.remove(args.userId)
                    } break;

                    case 'group_promoteUser': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        await m.chat.promote(args.userId)
                    } break;

                    case 'group_demoteUser': {
                        await m.chat.demote(args.userId)
                    } break;

                    case 'group_setName': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        await m.chat.setName(args.newName)
                    } break;
                    case 'group_setDescription': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        await m.chat.setDesc(args.newDescription)

                    } break;
                    case 'group_revokeInviteLink': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        await m.chat.revoke();
                    } break;
                    case 'group_toggleAnnouncements': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        await m.chat.settings.announce(args.announceOnly);
                    } break;
                    case 'group_getInviteLink': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        if (!m.sender.role('admin', 'owner')) return m.sms('admin')

                        const link = await m.chat.getLinkInvite();

                        object.push({ text: `Aquí tienes el enlace de invitación:\n${link}` })
                    } break;
                    case 'group_setPhoto':
                    case 'bot_setPhoto': {
                        const imgBuffer = m.content.media ? (await m.content.media.download())
                            : m.quoted?.content.media ? (await m.quoted.content.media.download()) : null;
                        if (!imgBuffer) return m.reply("Responde o envia a una imagen.");
                        if (name === 'group_setPhoto') {
                            if (!m.bot.roles.admin) return m.sms('botAdmin')
                            if (!m.sender.roles.admin) return m.sms('admin')
                            await m.chat.setPhoto(imgBuffer);
                        } else {
                            if (!m.bot.roles.admin) return m.sms('botAdmin')
                            if (!m.sender.roles.owner) return m.sms('owner')
                            await m.bot.setPhoto(imgBuffer)
                        }
                    } break;
                    case 'group_getPhoto': {
                        if (!m.bot.roles.admin) return m.sms('botAdmin')
                        object.push({ image: { url: await m.chat.getPhoto() } })
                    } break;
                    case 'bot_updateName': {
                        if (!m.sender.roles.owner) return m.sms('owner')
                        await m.bot.setName(args.newName)
                    } break;
                    case 'bot_updateStatus': {
                        if (!m.sender.roles.owner) return m.sms('owner')
                        await m.bot.setDesc(args.newStatus)
                    } break;
                    default: {
                        object.push({ text: `Función desconocida solicitada: ${name}` })
                    } break;
                }
            }

            if (object[0]) {
                for (const obj of object) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const message = await sock.sendMessage(m.chat.id, obj, { quoted: m.message });
                    await sock.saveMessageIdForResponse(message, {
                        user: m.sender.id,
                        response: [{
                            condition: async () => true,
                            extract: (m) => m.body,
                            command: (value) => `.ai ${value}`,
                            dynamic: true
                        }]
                    })
                }
            }

            await m.react('done');
        } else {
            const text_ia = response.text().trim();
            const message = await sock.sendMessage(m.chat.id, { text: text_ia }, { quoted: m.message });
            await sock.saveMessageIdForResponse(message, {
                user: m.sender.id,
                response: [{
                    condition: async () => true,
                    extract: (m) => m.body,
                    command: (value) => `.ai ${value}`,
                    dynamic: true
                }]
            })
            await m.react('✔️');
        }

        await db.update();

    } catch (e) {
        console.error(e);
        await m.react('error');

        const error429 = [
            "Oye, oye, más despacio. Ni que fuera yo un bot multi-tarea... ah, espera. Bueno, igual dame un minuto para recargar el ingenio.",
            "Tanta prisa... ¿Acaso me pagan por horas extra? Respira hondo y espera un minuto.",
            "Eh, tranquilo. Mi cerebro de silicio necesita un respiro. Dame un minuto."
        ]

        if (e.status === 429) {
            let errorText = error429[Math.floor(Math.random()
                * error429.length)];

            const message = await sock.sendMessage(m.chat.id, { text: errorText }, { quoted: m.message });
            await sock.saveMessageIdForResponse(message, {
                user: m.sender.id,
                response: [{
                    condition: async () => true,
                    extract: (m) => m.body,
                    command: (value) => `.ai ${value}`,
                    dynamic: true
                }]
            })

            await m.react('error');
        } else {
            console.error(e);
            await m.react('error');
        }
    }
};

export default plugin;