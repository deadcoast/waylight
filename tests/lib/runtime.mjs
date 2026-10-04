import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const distUrl = name => new URL(`../../dist/${name}`, import.meta.url).href;
export const browserOptions = {
  ...(process.env.WL_BROWSER ? { executablePath: process.env.WL_BROWSER } : {}),
  args: ['--disable-background-networking'],
};
