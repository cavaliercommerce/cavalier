module.exports = {
  "*.{ts,tsx,json,jsonc}": ['prettier --no-error-on-unmatched-pattern --write "**/*.(ts|tsx)"', "biome lint --write"],
};
