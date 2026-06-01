/** Injected at CI build via `--define process.env.DOCUGIT_VERSION='"v..."'` */
export const DOCUGIT_VERSION = process.env.DOCUGIT_VERSION || "dev";
