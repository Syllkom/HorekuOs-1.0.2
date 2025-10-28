import path from 'path';
import fs from 'fs/promises';
import base from './funs/fun.makeDBase.js';

const { proto } = (await import('@whiskeysockets/baileys/WAProto/index.js')).default;

global.$package = await fs.readFile(path.resolve('package.json'))
    .then(data => JSON.parse(data))

global.$dir_main = {
    creds: path.resolve('./storage/@main/creds'),
    store: path.resolve('./storage/@main/store'),
    temp: path.resolve('./storage/@main/temp'),
}

global.$simpleDB = base;
global.$proto = proto;

global.$dir_bot = {}