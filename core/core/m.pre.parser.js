import $base from '../funs/fun.makeDBase.js';
export default async ({ m, sock, message, contextInfo }) => {

    const db = await $base.open('system:SMIFR')
    if (!db.data[contextInfo.stanzaId]) return;
    const resCmd = structuredClone(db.data[contextInfo.stanzaId])

    resCmd.response = await Promise.all(resCmd.response.map(async (o) =>
        Object.fromEntries(await Promise.all(Object.entries(o)
            .map(async ([key, value]) => {
                if (key == 'extract' && (/=>/g).test(value)) value = eval(value)
                if (key == 'condition' && (/=>/g).test(value)) value = eval(value)
                if (key == 'command' && (/=>/g).test(value)) value = eval(value)
                return [key, value];
            })))
    ))

    if (!(resCmd.user === 'all' || resCmd.user === m.sender.id)) return;
    if (resCmd.once) delete db.data[contextInfo.stanzaId]
    for (const response of resCmd.response) {
        if (await response.condition(m, { response })) {
            if (response.dynamic && response.extract && typeof response.command === 'function') {
                return m.body = await response.command(await response.extract(m, { response }))
            } else if (typeof response.command === 'string') {
                return m.body = response.command
            }
        }
    }
    await db.update()
}