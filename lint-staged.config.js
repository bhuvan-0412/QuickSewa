const path = require("node:path");

module.exports = {
  // Run Biome check and format on all supported staged files
  "*.{js,jsx,ts,tsx,css,json}": ["biome check --write --no-errors-on-unmatched"],

  // Run Next Lint only on staged JS/TS files
  "*.{js,jsx,ts,tsx}": (filenames) => {
    const relativePaths = filenames.map((file) => path.relative(process.cwd(), file));
    return `next lint --file ${relativePaths.join(" --file ")}`;
  },
};
