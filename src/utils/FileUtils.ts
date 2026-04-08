import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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
    }

}