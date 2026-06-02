// Config Metro pour monorepo : observe la racine et résout les packages workspace.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Déduplication de React : le monorepo héberge React 19 (mobile) et React 18
// (web). Le hoisting npm peut laisser plusieurs copies de `react` résolvables
// (ex. 19.1.0 nesté + 19.2.6 hoisté), ce qui provoque « Invalid hook call /
// more than one copy of React ». On force chaque import `react` du bundle mobile
// vers une seule copie physique : celle de l'app (version exacte du SDK Expo).
const reactRoot = path.resolve(projectRoot, 'node_modules/react');
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    const target = path.join(reactRoot, moduleName.slice('react'.length));
    return context.resolveRequest(context, target, platform);
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
