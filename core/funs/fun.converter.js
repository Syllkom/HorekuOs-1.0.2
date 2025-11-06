import ff from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import webp from 'node-webpmux'
import { Readable } from 'stream'
import fs from 'fs'
import path from 'path'

ff.setFfmpegPath(ffmpegPath)

async function bufferToWebp(mediaBuffer, isVideo = false) {
    return new Promise((resolve, reject) => {
        const tempInputFile = path.join(process.cwd(), `temp_input_${Date.now()}${isVideo ? '.mp4' : '.jpg'}`);
        const tempOutputFile = path.join(process.cwd(), `temp_output_${Date.now()}.webp`);

        fs.writeFileSync(tempInputFile, mediaBuffer);

        ff(tempInputFile)
            .outputOptions([
                '-vcodec', 'libwebp', 
                '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                ...(isVideo ? [
                    '-loop', '0', 
                    '-ss', '00:00:00', 
                    '-t', '00:00:05', 
                    '-preset', 'default', 
                    '-an', 
                    '-vsync', '0'
                ] : [])
            ])
            .toFormat('webp')
            .on('error', (err) => {
                fs.unlinkSync(tempInputFile);
                reject(err);
            })
            .on('end', () => {
                const outputBuffer = fs.readFileSync(tempOutputFile);
                fs.unlinkSync(tempInputFile);
                fs.unlinkSync(tempOutputFile);

                resolve(outputBuffer);
            })
            .save(tempOutputFile);
    });
}

async function writeExif(mediaBuffer, metadata = {}, isVideo = false) {
    try {
        const webpBuffer = await bufferToWebp(mediaBuffer, isVideo);
        
        const packname = metadata.packname || '';
        const author = metadata.author || '';
        const categories = metadata.categories || ["👁️"];

        const img = new webp.Image();
        const json = { 
            "sticker-pack-name": packname, 
            "sticker-pack-publisher": author, 
            "emojis": categories 
        };

        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 
            0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);

        const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);

        await img.load(webpBuffer);
        img.exif = exif;

        const outputBuffer = await img.save(null);
        return outputBuffer;

    } catch (error) {
        console.error('Error en writeExif:', error);
        throw error;
    }
}

const imageWebp = async (media, metadata = {}) => await writeExif(media, metadata, false);
const videoWebp = async (media, metadata = {}) => await writeExif(media, metadata, true);

export { imageWebp, videoWebp }
