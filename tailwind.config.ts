import type { Config } from 'tailwindcss';
export default { content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme:{extend:{colors:{ink:'#070b18',panel:'#0d1427',line:'rgba(148,163,184,.14)',cyan:'#38bdf8',violet:'#8b5cf6'},boxShadow:{glow:'0 0 45px rgba(56,189,248,.13)'}}}, plugins:[] } satisfies Config;
