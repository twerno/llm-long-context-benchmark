import { existsSync, mkdirSync, writeFileSync, statSync, readFileSync } from "node:fs";
import path from "node:path";

export default {
    toSafeFilename(input: string): string {
        return input
            .normalize("NFKD")                 // rozbija np. "ł" → "l"
            .replace(/[\u0300-\u036f]/g, "")   // usuwa diakrytyki
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // niedozwolone znaki (Windows)
            .replace(/\s+/g, "_")              // spacje → _
            .replace(/\.+$/, "")               // usuń kropki na końcu
            .trim();
    },

    createDirectorySafe(dirPath: string) {
        if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
        }
    },

    writeFile(dirPath: string, filename: string, message: string) {
        this.createDirectorySafe(dirPath);
        writeFileSync(path.join(dirPath, filename), message)
    },

    readFile(dirPath: string, filename: string) {
        const filepath = path.join(dirPath, filename)
        return readFileSync(filepath, { encoding: "utf-8" })
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
    },

    fileExist(dirPath: string, filename: string) {
        try {
            const filepath = path.join(dirPath, filename)
            const stats = statSync(filepath);
            if (stats && stats.isFile()) {
                return true;
            }
            if (!stats) {
                return false
            }
            throw new Error(`${filepath} Exists, but is not a file.`)
        } catch (err) {
            return false;
        }
    },

    saveAsCsv(dirPath: string, filename: string, rows: object[]) {
        if (rows.length == 0) {
            this.writeFile(dirPath, filename, "")
            return;
        }

        const csvRows = rows
            .map(record => Object.values(record)
                .map(v => JSON.stringify(v))
                .map(v => v && v.replace(/;/g, "_"))
                .join(";")
            )

        const headerRow = Object.keys(rows[0])
            .map(header => JSON.stringify(header))
            .map(v => v && v.replace(/;/g, "_"))
            .join(";");

        const body = headerRow + "\n" + csvRows.join("\n")
        this.writeFile(dirPath, filename, body)
    }
}