import "https://deno.land/x/dotenv/load.ts";

// @ts-ignore
const env = Deno.env.toObject();

console.log(env);
