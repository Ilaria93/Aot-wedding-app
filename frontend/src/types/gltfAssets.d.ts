declare module '*.glb' {
  const asset: string;
  export default asset;
}

declare module '*.glb?url' {
  const url: string;
  export default url;
}

declare module '*.gltf' {
  const asset: string;
  export default asset;
}
