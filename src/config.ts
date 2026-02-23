import fs from "fs";

type Config = {
  dbUrl: string;
  currentUserName: string;
};

export function setUser(user: string) {
  const config = readConfig();
  writeConfig({ ...config, currentUserName: user });
}

export function readConfig(): Config {
  const path = getConfigFilePath();
  const raw = fs.readFileSync(path, "utf-8");
  const validated = validateConfig(raw);
  return validated;
}

function writeConfig(config: Config) {
  const path = getConfigFilePath();
  const toWrite = {
    db_url: config.dbUrl,
    current_user_name: config.currentUserName,
  };
  fs.writeFileSync(path, JSON.stringify(toWrite, null, 2));
}

function getConfigFilePath(): string {
  return "/Users/alunturner/code/bootdev-aggregator-cli/.gatorconfig.json";
}

function validateConfig(rawConfig: any): Config {
  const parsed = JSON.parse(rawConfig);

  return {
    dbUrl: parsed.db_url,
    currentUserName: parsed.current_user_name,
  };
}
