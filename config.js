// folder: source

// globales
import path from 'path';
import fs from 'fs'

global.readMore = String
    .fromCharCode(8206)
    .repeat(850);

global.settings = {
    "setDBPort": 8000,
    "setServerIp": "",

    "mainBotStore": false,
    "mainBotNumber": "",
    "mainBotPrefix": ".¿?¡!#%&/,~@",
    "mainBotName": "@HorekuOs",
    "mainBotAuto-read": true,

    "subBotStore": false,
    "subBotPrefix": ".¿?¡!#%&/,~@",
    "subBotName": "@HorekuOs (subBot)",
    "subBotAuto-read": true,

    "reactEmojis": {
        "waiting": "⌛",
        "success": "✔️",
        "failure": "✖️"
    },
    "SetUserRoles": {
        "5216678432366": {
            "rowner": true,
            "owner": true,
            "modr": true,
            "prem": true
        }
    }
}