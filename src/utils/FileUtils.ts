import { existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";

export default {
    createDirectorySafe(dirPath: string) {
        if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
        }
    },

    writeFile(dirPath: string, filename: string, message: string) {
        this.createDirectorySafe(dirPath);
        writeFileSync(path.join(dirPath, filename), message)
    },

    directoryExist(dirPath: string) {
        try {
            const stats = statSync(dirPath);
            if (stats && stats.isDirectory()) {
                return true;
            }
            if (!stats) {
                return false
            }
            throw new Error(`${dirPath} Exists, but is not a directory.`)
        } catch (err) {
            return false;
        }
    }
}