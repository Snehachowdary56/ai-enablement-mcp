import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** Knowledge base folder: KB_DIR, or ./kb next to src/ and dist/. */
export const KB_DIR = process.env.KB_DIR ?? path.resolve(here, "../kb");
