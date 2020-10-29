const path = require('path');
const fs = require('fs');

const PROJ_PATH = path.resolve(__dirname, '..');

const TARGETS = {
  config: path.resolve(PROJ_PATH, 'public', 'config.json'),
};

const SOURCES = {
  dev: {
    config: path.resolve(PROJ_PATH, 'secrets', 'config.stg.json'),
  },
  stg: {
    config: path.resolve(PROJ_PATH, 'secrets', 'config.stg.json'),
  },
  prd: {
    config: path.resolve(PROJ_PATH, 'secrets', 'config.prd.json'),
  },
};

function main(args) {
  if ((args || []).length < 3) {
    console.error('No environment specified. Please specify either stg or prd');
  }

  const sources = SOURCES[args[2]];

  Object.entries(sources).forEach(([sourceName, sourcePath]) => {
    const targetPath = TARGETS[sourceName];
    fs.copyFileSync(sourcePath, targetPath);
  });
}

main(process.argv);
