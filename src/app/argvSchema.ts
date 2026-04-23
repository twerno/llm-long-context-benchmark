import z from "zod";

export const ZArgvSchema = z.object({
    configFilePath: z.string().optional(),
    rootDir: z.string().optional(),
    testId: z.string().optional(),
    resumeUnfinishedRun: z.boolean().optional()
});