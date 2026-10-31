import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { robotAttackPose, robotEyeBurstReady, ROBOT_DEPLOY_SECONDS } from '../src/robot-assault.js';
import { createGroundEnemy, animateGroundEnemy, robotEyeMuzzles, fireGroundRobotEyes } from '../src/encounters.js';
import { addFiveCatsIffTag } from '../src/five-cats-runtime.js';
import { createCity33Premium } from '../src/city-33-premium.js';

const anchors = Array.from({length:200}, (_,i)=>({
  x:(i%2 ? 1:-1)*(116+i%7*12),
  z:-30-Math.floor(i/2)*19,
  h:40+i%10*6,w:10+i%6,depth:12+i%5,
}));

test('robots descend into assault stance and track laterally before becoming armed', () => {
  const entry=robotAttackPose(0,17,-7,2,0,false);
  const landing=robotAttackPose(ROBOT_DEPLOY_SECONDS,17,-7,2,0,false);
  const chase=robotAttackPose(6,17,-7,2,22,false);
  assert.ok(entry.y > 15,'arrival silhouette visible above the street');
  assert.equal(landing.y,-7,'robot lands on actual ground');
  assert.notEqual(entry.x,landing.x,'flanking entry from side');
  assert.notEqual(chase.x,landing.x,'robot actively repositions in combat');
  assert.equal(landing.deployed,true);
  assert.equal(robotEyeBurstReady(1,-70,0),false,'no unfair shots while entering');
  assert.equal(robotEyeBurstReady(3,-100,0),true,'first attack after landing and approach');
  assert.equal(robotEyeBurstReady(3,-100,1),false);
});

test('walker eyes are physical muzzle sockets and beams activate with real player targeting', () => {
  const model=createGroundEnemy('walker',1);
  model.position.set(15,-7,-100);
  const player=new T.Vector3(0,5,10);
  assert.equal(robotEyeMuzzles(model).length,2);
  for (const side of ['left','right']) {
    assert.ok(model.getObjectByName('enemy-robot-eye-'+side)?.isMesh);
    assert.ok(model.getObjectByName('enemy-robot-eye-ray-'+side)?.isMesh);
  }
  animateGroundEnemy(model, 3, player, 1, true);
  fireGroundRobotEyes(model, 2);
  animateGroundEnemy(model, 4, player, 2.1);
  const ray=model.getObjectByName('enemy-robot-eye-ray-left');
  assert.equal(ray.visible,true);
  assert.ok(ray.scale.y > 10, 'ray reaches from eyes toward player');
  animateGroundEnemy(model,4.6,player,2.4);
  assert.equal(ray.visible,false,'beam fades after burst');
  const other=createGroundEnemy('walker',1);
  assert.notEqual(ray.material,other.getObjectByName('enemy-robot-eye-ray-left').material,
    'parallel robot shots cannot change each other alpha');
});

test('allied fighters carry green world-space visible IFF tags separate from enemies', () => {
  const wing=new T.Group();
  const tag=addFiveCatsIffTag(wing,{id:'bia',name:'BIA'});
  assert.equal(tag.name,'five-cats-ally-tag-bia');
  assert.ok(tag.isSprite);
  assert.equal(tag.userData.ally,true);
  assert.equal(tag.userData.visualOnly,true);
  assert.ok(tag.position.y > 0);
  assert.equal(tag.material.depthTest,false);
  assert.equal(wing.children.length,1);
  assert.equal(createGroundEnemy('walker',1).getObjectByName('five-cats-ally-tag-bia'),undefined);
});

test('City 3.4 adds thousands of distinct framed windows in Medium, not additional individual draw calls', () => {
  const city=createCity33Premium(anchors);
  const medium=city.getObjectByName('city33-architecture-medium');
  const frames=medium.getObjectByName('city34-detailed-window-frames');
  const glass=medium.getObjectByName('city34-tempered-glass-panes');
  const warm=medium.getObjectByName('city34-warm-occupied-windows');
  assert.ok(frames.isInstancedMesh && glass.isInstancedMesh && warm.isInstancedMesh);
  assert.ok(frames.count > 5000 && frames.count === glass.count);
  assert.ok(warm.count > 200 && warm.count < glass.count / 2);
  assert.ok(glass.instanceColor, 'restrained glass palette for each pane');
  assert.ok(medium.getObjectByName('city34-architectural-floor-cornices').count >= 400);
  const structure=medium.getObjectByName('city33-facade-recessed-glass');
  const panel=new T.Matrix4();
  structure.getMatrixAt(0,panel);
  const position=new T.Vector3(),quaternion=new T.Quaternion(),scale=new T.Vector3();
  panel.decompose(position,quaternion,scale);
  assert.ok(position.z < anchors[0].z + anchors[0].depth/2 + 0.6,'recess cannot cover fenestration');
});
