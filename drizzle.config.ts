import { defineConfig } from "drizzle-kit";
import { readConfig } from "./src/config.ts";

const config = readConfig();

export default defineConfig({
  schema: "src/schema.ts",
  out: "src/generated",
  dialect: "postgresql",
  dbCredentials: {
    url: config.dbUrl,
  },
});
