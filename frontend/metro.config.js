const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const threeRoot = path.resolve(projectRoot, 'node_modules/three');
const threeModulePath = path.resolve(threeRoot, 'build/three.module.js');

const config = getDefaultConfig(projectRoot);

config.resolver.assetExts.push('glb', 'gltf', 'fbx');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  three: threeRoot,
};

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return {
      type: 'sourceFile',
      filePath: threeModulePath,
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = config;
