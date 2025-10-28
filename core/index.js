// folder: source

import fs from 'fs';
import path from 'path';

await import('../config.js')
await import('./config.js')

import $process from './funs/fun.p.Process.js';
import chalk from 'chalk';

chalk.level = 2

Object.assign($process.env, {
    data: $process.env.dataConfig || {},
    options: $process.env.connOptions || {},
    subBot: $process.env.dataConfig.subBot,
})

const { data } = $process.env;
const folder = path.resolve(data.subBot
    ? `./storage/${data.slot}` : `./storage/@main`)

fs.mkdirSync(folder, { recursive: true });
for (const _folder of ['creds', 'store', 'temp']) {
    fs.mkdirSync(path.join(folder, _folder),
        { recursive: true });
}

Object.assign($process.env, {
    path: {
        plugins: path.resolve('./plugins'),
        creds: path.join(folder, "creds"),
        store: path.join(folder, "store"),
        tmp: path.join(folder, 'temp'),
    }
})

await import('./main.js');