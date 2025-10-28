// folder: library

import path from 'path'
import fs from 'fs/promises'
import logger from './fun.p.logger.js';
import $process from './fun.p.Process.js';

const _path = $process.env.path

setInterval(async () => {
    try {
        const files = await fs.readdir(_path.tmp)
        if (files.length < 1) return false

        const unlink = async (file) => {
            try { await fs.unlink(path.join(_path.tmp, file)) }
            catch (e) { logger.error(e) }
        }

        for (const file of files) {
            unlink(file)
        }
    } catch (e) { logger.error(e) }
}, 1000 * 60)
