// Shared by clay/analysis surfaces and depth-tested annotations. Coordinates are CSS pixels.
export const revealGLSL = /* glsl */ `
uniform sampler2D uRevealMask;
uniform vec2 uDrawingSize;
uniform vec2 uCssSize;
uniform float uFull;
uniform float uPixelSize;
uniform float uEdgeNoise;
uniform vec2 uPointer;
uniform float uPointStrength;
uniform float uPointRadius;
float pointCloudCore() {
  vec2 css=gl_FragCoord.xy/uDrawingSize*uCssSize;
  return (1.-smoothstep(uPointRadius*.58,uPointRadius,length(css-uPointer)))*uPointStrength;
}
float scanHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float revealAtFragment() {
  if (uFull > .5) return 1.;
  vec2 css = gl_FragCoord.xy / uDrawingSize * uCssSize;
  vec2 cell = floor(css / uPixelSize);
  vec2 uv = (cell * uPixelSize + uPixelSize * .5) / uCssSize;
  float field = texture2D(uRevealMask, uv).r;
  float cluster = scanHash(floor(cell / 3.));
  float threshold = .11 + uEdgeNoise * scanHash(cell) + uEdgeNoise * .33 * cluster;
  return smoothstep(threshold, threshold + .085, field);
}
`;

export const maskVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`;
export const maskFragment = /* glsl */ `
uniform sampler2D uPrevious;
uniform vec2 uCssSize;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uDelta;
uniform float uTau;
uniform float uRadius;
uniform float uActive;
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y); }
void main() {
  vec2 p=vUv*uCssSize, ab=uTo-uFrom;
  float h=clamp(dot(p-uFrom,ab)/max(dot(ab,ab),.001),0.,1.);
  float d=length(p-uFrom-ab*h);
  float organic = noise(p/83.+uTime*.025) * .12 + noise(p/41.) * .07;
  float r=uRadius*(.9+organic);
  float stamp=(1.-smoothstep(r*.52,r,d))*uActive;
  // RGBA8 rounding can retain a faint field forever; remove a sub-texel value each step.
  float old=max(0.,texture2D(uPrevious,vUv).r*exp(-uDelta/max(uTau,.015))-.6/255.);
  float value=max(old,stamp);
  gl_FragColor=vec4(value,value,value,1.);
}
`;

export const surfaceDeclarations = /* glsl */ `
${revealGLSL}
uniform int uMode;
uniform int uPreviousMode;
uniform float uModeBlend;
uniform float uThemeDark;
uniform float uTime;
uniform float uScientific;
uniform float uInstance;
uniform float uActorHighlight;
uniform float uIsActor;
uniform float uIsGround;
uniform float uIsBuilding;
uniform vec3 uClassColor;
uniform vec3 uInstanceColor;
uniform vec2 uDepthRange;
uniform vec2 uCameraClip;
uniform vec3 uNormalCyan;
uniform vec3 uNormalBlue;
uniform vec3 uNormalViolet;
uniform vec3 uNormalMagenta;
uniform float uNormalCoreRadius;
uniform float uNormalCoreStrength;
uniform float uNormalCoreTime;
varying vec3 vScanNormal;
varying vec3 vScanWorld;
uniform vec3 uRgbTint;
uniform int uSurfaceKind;
uniform float uSurfaceSeed;
uniform sampler2D uConcrete,uAsphalt,uBrick;
vec3 toLinear(vec3 c) { return pow(c,vec3(2.2)); }
vec3 rgbSurface(vec3 lit) {
  vec3 n=normalize(vScanNormal);
  vec2 uv=abs(n.y)>.5?vScanWorld.xz:vec2(abs(n.x)>.5?vScanWorld.z:vScanWorld.x,vScanWorld.y);
  float illumination=clamp(dot(lit,vec3(.2126,.7152,.0722)),.12,1.65);
  vec3 grain=texture2D(uConcrete,uv*.22).rgb;
  vec3 tint=uRgbTint;
  if(uSurfaceKind==1) grain=texture2D(uAsphalt,uv*.34).rgb;
  if(uSurfaceKind==2){
    float wall=1.-smoothstep(.2,.55,abs(n.y));
    float style=fract(sin(uSurfaceSeed*13.17)*7183.21);
    if(style>.57&&wall>.5){grain=texture2D(uBrick,uv*vec2(.13,.19)).rgb;tint=mix(tint,vec3(.73,.57,.44),.35);}
    vec2 window=fract(uv/vec2(1.8,3.05));
    float pane=step(.23,window.x)*step(window.x,.67)*step(.3,window.y)*step(window.y,.62)*wall;
    vec3 glass=mix(vec3(.055,.105,.15),vec3(.22,.35,.42),clamp(n.y*.4+n.z*.23+.38,0.,1.));
    tint=mix(tint,glass,pane*.88);
    tint=mix(tint,vec3(.43,.46,.47),smoothstep(.5,.85,n.y)*.35);
  }
  if(uSurfaceKind==3)grain*=.86+.14*scanHash(floor(vScanWorld.xz*3.));
  return tint*grain*(.42+.67*illumination);
}
float lineAt(float value, float interval,float pixelWidth) {
  float cell=abs(fract(value/interval-.5)-.5)/max(pixelWidth/interval,.0001);
  return 1.-min(cell,1.);
}
vec3 analysisSurfaceForMode(vec3 beauty,vec3 rgb,int mode,vec3 worldDx,vec3 worldDy) {
  if(mode==0)return rgb;
  vec3 n=normalize(vScanNormal);
  float luminance=dot(beauty,vec3(.2126,.7152,.0722));
  vec3 cyan=toLinear(uNormalCyan);
  vec3 violet=toLinear(uNormalViolet);
  vec3 pink=toLinear(uNormalMagenta);
  vec3 navy=toLinear(vec3(.025,.09,.145));
  float orientation=clamp(.5+.5*dot(normalize(n.xz+vec2(.0001)),normalize(vec2(-.8,.6))),0.,1.);
  vec3 facade=mix(toLinear(uNormalBlue),violet,clamp(n.z*.5+.5,0.,1.));
  vec3 normalColor=mix(facade,pink,orientation);
  normalColor=mix(normalColor,cyan,smoothstep(.25,.94,n.y));
  normalColor*=.5+.5*clamp(luminance,0.,1.);
  if (uScientific>.5) normalColor=toLinear(n*.5+.5);
  vec3 worldWidth=abs(worldDx)+abs(worldDy);
  float gridX=lineAt(vScanWorld.x,1.,worldWidth.x), gridZ=lineAt(vScanWorld.z,1.,worldWidth.z);
  float grid=max(gridX,gridZ);
  float range=length(vScanWorld.xz);
  vec2 rangeGradient=vScanWorld.xz/max(range,.0001);
  float rangeWidth=abs(dot(rangeGradient,worldDx.xz))+abs(dot(rangeGradient,worldDy.xz));
  float rings=lineAt(range,5.,rangeWidth);
  vec3 result=normalColor;
  if(mode==0 && uIsGround>.5 && uScientific<.5) result=navy+cyan*(grid*.055+rings*.045);
  if(mode==1) {
    vec3 p=vScanWorld*2.1;
    vec3 f=abs(fract(p)-.5);
    float surfacePoint=1.-smoothstep(.1,.2,min(min(length(f.xy),length(f.xz)),length(f.yz)));
    float sweep=pow(max(0.,cos(atan(vScanWorld.z,vScanWorld.x)-uTime*.32)),24.);
    float heightContour=lineAt(vScanWorld.y,1.5,worldWidth.y)*(1.-smoothstep(.25,.8,n.y));
    result=navy*(.9+luminance*.35)+cyan*(heightContour*.055+surfacePoint*.12+grid*.025*uIsGround+rings*.07*uIsGround+sweep*.05);
    if(uIsActor>.5) result=mix(result,toLinear(uClassColor),.18);
  }
  if(mode==2) {
    result=toLinear(mix(uClassColor,uInstanceColor,uInstance))*(.54+.42*luminance);
    vec2 css=gl_FragCoord.xy/uDrawingSize*uCssSize;
    // Use the same CSS pixel grid as the outer scan, with a slowly breathing,
    // dithered frontier rather than a circular alpha gradient.
    vec2 cell=floor(css/uPixelSize);
    vec2 pixel=(cell+.5)*uPixelSize;
    float phase=uNormalCoreTime*.8;
    float ripple=sin(dot(floor(cell/5.),vec2(.71,1.13))+phase)*.035;
    float radius=uNormalCoreRadius*(.96+ripple+.055*scanHash(floor(cell/6.)));
    float envelope=1.-smoothstep(radius*.55,radius,length(pixel-uPointer));
    float threshold=.12+.38*scanHash(cell)+.12*scanHash(floor(cell/3.));
    float shimmer=sin(phase+scanHash(cell)*6.283)*.045;
    float core=smoothstep(threshold-.055,threshold+.065,envelope+shimmer)*uNormalCoreStrength;
    result=mix(result,normalColor,core);
  }
  if(mode==3) {
    float cameraDepth=mix(uCameraClip.x,uCameraClip.y,gl_FragCoord.z);
    float depth=clamp((cameraDepth-uDepthRange.x)/(uDepthRange.y-uDepthRange.x),0.,1.);
    result=mix(cyan,toLinear(vec3(.12,.08,.29)),depth);
    result=mix(result,vec3(.68,.89,.92),pow(1.-depth,6.)*.45);
  }
  // Control keeps the city readable; velocity vectors form its visual layer.
  if(mode==4) result=mix(beauty,navy+cyan*(grid*.03*uIsGround),.28);
  if(uActorHighlight>.5 && uIsActor>.5 && mode!=2) result=mix(result,toLinear(uClassColor),.58);
  return result;
}
vec3 analysisSurface(vec3 beauty,vec3 rgb,vec3 worldDx,vec3 worldDy) {
  vec3 target=analysisSurfaceForMode(beauty,rgb,uMode,worldDx,worldDy);
  if(uModeBlend>=.999)return target;
  return mix(analysisSurfaceForMode(beauty,rgb,uPreviousMode,worldDx,worldDy),target,smoothstep(0.,1.,uModeBlend));
}
`;
