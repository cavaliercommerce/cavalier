module.exports = {
  "*.{ts,tsx,json,jsonc}": ['prettier --write "**/*.ts"', "biome lint --write"],
};
