// A shared world-space voxel mask keeps facades, instanced windows, shadows and
// the SLAM cloud in agreement while one building dissolves and reassembles.
export const buildingRebuildGLSL = /* glsl */ `
uniform vec3 uRebuildMin,uRebuildMax;
uniform float uRebuildActive,uRebuildCoverage;
float rebuildHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
bool rebuildContains(vec3 p){return uRebuildActive>.5&&all(greaterThanEqual(p,uRebuildMin))&&all(lessThanEqual(p,uRebuildMax));}
float rebuildThreshold(vec3 p){float h=clamp((p.y-uRebuildMin.y)/(uRebuildMax.y-uRebuildMin.y),0.,1.);return .08+.64*h+.25*rebuildHash(floor(p*1.65));}
bool rebuildDiscard(vec3 p){return rebuildContains(p)&&uRebuildCoverage<rebuildThreshold(p);}
`;
