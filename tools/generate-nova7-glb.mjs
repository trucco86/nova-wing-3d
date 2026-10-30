import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const materials = [
  ['NOVA7_PAINT', [0.39, 0.66, 0.78, 1], .81, .27, [0, 0, 0]],
  ['NOVA7_GRAPHITE', [0.027, 0.064, 0.094, 1], .7, .37, [0, 0, 0]],
  ['NOVA7_TITANIUM', [0.7, 0.79, 0.81, 1], .86, .24, [0, 0, 0]],
  ['NOVA7_CANOPY', [0.047, 0.32, 0.47, .85], .48, .13, [.01, .07, .12]],
  ['NOVA7_CYAN', [.05, .61, .81, 1], .16, .27, [.11, .87, 1.0]],
  ['NOVA7_AMBER', [.89, .33, .07, 1], .19, .28, [1, .48, .07]],
];
const parts = materials.map(() => ({ position: [], normal: [] }));
const vec = (x, y, z) => [x, y, z];
function tri(mat, a, b, c) {
  const ab = b.map((v, i) => v - a[i]), ac = c.map((v, i) => v - a[i]);
  const n = [ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
  const len = Math.hypot(...n) || 1;
  for (const p of [a, b, c]) {
    parts[mat].position.push(...p);
    parts[mat].normal.push(...n.map(v => v / len));
  }
}
const quad = (m, a, b, c, d) => {tri(m, a, b, c);tri(m, a, c, d);};
function block(m, x, y, z, w, h, d, yaw=0) {
  const cs=Math.cos(yaw), sn=Math.sin(yaw), p=[];
  for(const yy of [-1,1]) for(const xx of [-1,1]) for(const zz of [-1,1]) {
    const dx=xx*w/2,dz=zz*d/2;
    p.push(vec(x+dx*cs+dz*sn,y+yy*h/2,z-dx*sn+dz*cs));
  }
  for(const [a,b,c,d] of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]])
    quad(m,p[a],p[b],p[c],p[d]);
}
function extrude(m, points, top, depth) {
  const y0=top-depth;
  for (let i=1;i<points.length-1;i++){
    const a=points[0],b=points[i],c=points[i+1];
    tri(m,vec(a[0],top,a[1]),vec(b[0],top,b[1]),vec(c[0],top,c[1]));
    tri(m,vec(c[0],y0,c[1]),vec(b[0],y0,b[1]),vec(a[0],y0,a[1]));
  }
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    quad(m,vec(a[0],top,a[1]),vec(a[0],y0,a[1]),
      vec(b[0],y0,b[1]),vec(b[0],top,b[1]));
  }
}
function barrel(m,cx,cy,z1,z2,r1,r2,segments=20) {
  for(let i=0;i<segments;i++){
    const a=i/segments*2*Math.PI,b=(i+1)/segments*2*Math.PI;
    const a1=vec(cx+Math.sin(a)*r1,cy+Math.cos(a)*r1,z1);
    const b1=vec(cx+Math.sin(b)*r1,cy+Math.cos(b)*r1,z1);
    const a2=vec(cx+Math.sin(a)*r2,cy+Math.cos(a)*r2,z2);
    const b2=vec(cx+Math.sin(b)*r2,cy+Math.cos(b)*r2,z2);
    quad(m,a1,b1,b2,a2);
    tri(m,vec(cx,cy,z1),b1,a1);
    tri(m,vec(cx,cy,z2),a2,b2);
  }
}
function exhaustRing(m,cx,cy,z,outer,inner,depth,segments=24) {
  for(let i=0;i<segments;i++){
    const a=i/segments*2*Math.PI,b=(i+1)/segments*2*Math.PI;
    const point=(t,r,zz)=>vec(cx+Math.sin(t)*r,cy+Math.cos(t)*r,zz);
    quad(m,point(a,outer,z),point(b,outer,z),point(b,outer,z+depth),point(a,outer,z+depth));
    quad(m,point(a,inner,z),point(a,inner,z+depth),point(b,inner,z+depth),point(b,inner,z));
    quad(m,point(a,inner,z+depth),point(a,outer,z+depth),point(b,outer,z+depth),point(b,inner,z+depth));
  }
}
// Continuous armored fuselage with dense sectional curvature.
const profile = [
 [-3.78,.055,.09],[-3.35,.25,.18],[-2.90,.46,.27],[-2.37,.72,.37],
 [-1.78,.91,.46],[-1.03,1.02,.52],[-.28,.94,.51],
 [.58,.89,.48],[1.35,.82,.43],[2.18,.59,.37],[2.83,.37,.25],[3.16,.10,.11]
];
for(let i=0;i<profile.length-1;i++){
  const [z1,r1,h1]=profile[i],[z2,r2,h2]=profile[i+1];
  for(let j=0;j<24;j++){
    const a=j/24*2*Math.PI,b=(j+1)/24*2*Math.PI;
    const pos=(z,r,h,t)=>vec(Math.sin(t)*r,.18+Math.cos(t)*h,z);
    quad(0,pos(z1,r1,h1,a),pos(z1,r1,h1,b),pos(z2,r2,h2,b),pos(z2,r2,h2,a));
  }
}
// Canopy optical half-dome: layered hoops instead of a flattened rectangle.
for(let i=0;i<10;i++){
  const t=i/10*Math.PI*.5,s=(i+1)/10*Math.PI*.5;
  for(let j=0;j<26;j++){
    const a=j/26*2*Math.PI,b=(j+1)/26*2*Math.PI;
    const p=(t,a)=>vec(Math.cos(t)*Math.sin(a)*.64,
      .85+Math.sin(t)*.51,-1.34+Math.cos(t)*Math.cos(a)*1.32);
    quad(3,p(t,a),p(t,b),p(s,b),p(s,a));
  }
}
block(2,0,1.38,-1.3,.065,.055,2.5);
block(1,0,.71,.23,.48,.12,3.0);
// Swept full-volume wing assemblies, not 2D planes; colors inherited by pilot paint.
for(const side of [-1,1]){
  const pts=[
    [side*.76,-1.12],[side*1.85,-.84],[side*3.68,.05],
    [side*5.0,.78],[side*4.42,1.24],[side*2.82,1.58],
    [side*1.28,1.26]
  ];
  extrude(0,pts,.42,.29);
  const inlay=[[side*1.68,-.28],[side*3.48,.46],[side*4.14,.93],
    [side*3.13,1.09],[side*1.94,.65]];
  extrude(1,inlay,.51,.095);
  extrude(2,[[side*2.45,.18],[side*3.45,.66],[side*3.22,.89],[side*2.28,.45]],.59,.045);
  for(let i=0;i<4;i++){
    block(1,side*(1.61+i*.30),.7,-.18+i*.19,.13,.085,.39,side*.34);
    block(4,side*(3.64+i*.24),.47,.69+i*.11,.055,.08,.33,side*.27);
  }
  for(let i=0;i<3;i++)
    block(2,side*(2.15+i*.7),.47,1.22-i*.03,.085,.075,.5,side*.2);
  // Dorsal vertical stabilizer, with cyan emitter in the edge.
  extrude(1,[[side*1.07,1.18],[side*1.23,2.15],[side*1.53,2.48],
    [side*1.89,1.48]],.96,.4);
  block(4,side*1.46,1.07,1.7,.08,.09,.8);
  const ex=side*1.22,ey=-.18;
  barrel(1,ex,ey,1.24,3.28,.58,.49,24);
  barrel(2,ex,ey,3.11,3.23,.54,.56,24);
  exhaustRing(4,ex,ey,3.29,.48,.33,.14,30);
  exhaustRing(5,ex,ey,3.44,.37,.27,.08,30);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const v=vec(ex+Math.sin(a)*.26,ey+Math.cos(a)*.26,3.51);
    block(2,v[0],v[1],v[2],.055,.06,.16,a);
  }
}
for(let i=0;i<5;i++){
  block(1,0,.78,-.94+i*.4,.52,.045,.10);
  block(4,0,.82,-.91+i*.4,.18,.055,.05);
}
function toBuffer(values) {
  const buf=Buffer.alloc(values.length*4);
  for(let i=0;i<values.length;i++)buf.writeFloatLE(values[i],i*4);
  return buf;
}
const chunks=[],views=[],accessors=[],primitives=[];let bytes=0;
function addBlock(buf, target){
  const offset=bytes;chunks.push(buf);bytes+=buf.byteLength;
  while(bytes%4){chunks.push(Buffer.alloc(1));bytes++;}
  const i=views.length;views.push({buffer:0,byteOffset:offset,byteLength:buf.byteLength,target});return i;
}
for(let material=0;material<materials.length;material++){
  const p=parts[material].position,n=parts[material].normal;
  const count=p.length/3;
  const posView=addBlock(toBuffer(p),34962),normalView=addBlock(toBuffer(n),34962);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<p.length;i+=3)for(let j=0;j<3;j++){
    min[j]=Math.min(min[j],p[i+j]);max[j]=Math.max(max[j],p[i+j]);
  }
  const pi=accessors.length;
  accessors.push({bufferView:posView,componentType:5126,count,type:'VEC3',min,max});
  accessors.push({bufferView:normalView,componentType:5126,count,type:'VEC3'});
  primitives.push({attributes:{POSITION:pi,NORMAL:pi+1},material,mode:4});
}
const gltf={
  asset:{version:'2.0',generator:'Nova Wing GLB Hero Exporter v1'},
  scene:0,scenes:[{nodes:[0]}],
  nodes:[{name:'NOVA7_HERO_HARDSURFACE',mesh:0}],
  meshes:[{name:'NOVA7_HERO_ASSET',primitives}],
  materials:materials.map(([name,color,metal,rough,emissive])=>({
    name,doubleSided:true,alphaMode:name==='NOVA7_CANOPY'?'BLEND':'OPAQUE',
    pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:metal,roughnessFactor:rough},
    emissiveFactor:emissive,
  })),
  accessors,bufferViews:views,buffers:[{byteLength:bytes}],
};
const json=Buffer.from(JSON.stringify(gltf),'utf8');
const padded=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const binary=Buffer.concat(chunks);
const header=Buffer.alloc(12);
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);
header.writeUInt32LE(12+8+padded.length+8+binary.length,8);
const chunkHeader=(type,len)=>{let b=Buffer.alloc(8);b.writeUInt32LE(len,0);b.writeUInt32LE(type,4);return b;};
const glb=Buffer.concat([
  header,chunkHeader(0x4e4f534a,padded.length),padded,
  chunkHeader(0x004e4942,binary.length),binary,
]);
const path='src/assets/nova7-hero.glb.base64';
await mkdir('src/assets',{recursive:true});
await writeFile(path,glb.toString('base64')+'\n');
console.log('NOVA-7 GLB generated',glb.length,'bytes',createHash('sha256').update(glb).digest('hex'),'triangles',parts.reduce((n,p)=>n+p.position.length/9,0));
