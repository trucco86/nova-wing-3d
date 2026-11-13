import * as T from 'three';
import {
  SQUAD_PILOTS,
  SQUAD_INTRO_DURATION,
  SQUAD_SPECIALS,
  formationPose,
  allySortieFlightAt,
  allySortieFlightPose,
  overdriveWingPose,
  ALLY_SORTIE_FLIGHT,
  canActivateSquadSpecial,
} from './five-cats-squad.js';

// World-space IFF tags attach to the ally ships, never to enemy fighters and
// never to the HUD center. Green and readable even in the city neon skyline.
const iffTextures = new Map();
function iffTexture(name, locale = 'pt') {
  const key = locale + ':' + name;
  if (iffTextures.has(key)) return iffTextures.get(key);
  const title = locale === 'en' ? 'ALLY' : 'ALIADO';
  let texture;
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(7,34,31,.88)';
      ctx.fillRect(0, 4, 384, 72);
      ctx.strokeStyle = '#71ffc1';
      ctx.lineWidth = 5;
      ctx.strokeRect(3, 6, 378, 68);
      ctx.fillStyle = '#a5ffd7';
      ctx.font = 'bold 29px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◆ ' + title + ' · ' + name, 192, 54, 359);
      texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
    }
  }
  if (!texture) {
    texture = new T.DataTexture(new Uint8Array([92, 242, 171, 240]), 1, 1);
    texture.needsUpdate = true;
  }
  iffTextures.set(key, texture);
  return texture;
}
export function addFiveCatsIffTag(mesh, pilot, locale = 'pt') {
  const tag = new T.Sprite(
    new T.SpriteMaterial({
      map: iffTexture(pilot.name, locale),
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  tag.name = 'five-cats-ally-tag-' + pilot.id;
  tag.userData.visualOnly = true;
  tag.userData.ally = true;
  tag.userData.pilotId = pilot.id;
  tag.userData.locale = locale;
  tag.position.set(0, 5.7, 0);
  tag.scale.set(13, 2.7, 1);
  mesh.add(tag);
  return tag;
}
/** Isolated, disposable Five Cats cinematic and physical-projectile supers. */
export function createFiveCatsSquad({
  scene,
  player,
  createWing,
  fireFrom,
  opponent,
  obstacleRange,
  notify,
  cue,
  status,
  formationStatus,
  getLanguage = () => 'pt',
}) {
  const wings = SQUAD_PILOTS.map((pilot) => {
    const mesh = createWing(pilot);
    mesh.visible = false;
    const label = addFiveCatsIffTag(mesh, pilot);
    scene.add(mesh);
    return { pilot, mesh, label };
  });
  let intro = 0;
  let plasmaTime = 0,
    overdriveTime = 0,
    plasmaCooldown = 0,
    overdriveCooldown = 0;
  let plasmaClock = 0,
    overdriveClock = 0,
    supportClock = 0;
  let overdriveAge = 0,
    overdriveExit = 0;
  let beam = null;
  function stopBeam() {
    if (!beam) return;
    for (const mesh of beam) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    beam = null;
  }
  function reset() {
    intro = 0;
    plasmaTime = overdriveTime = plasmaCooldown = overdriveCooldown = 0;
    plasmaClock = overdriveClock = supportClock = 0;
    overdriveAge = overdriveExit = 0;
    stopBeam();
    wings.forEach(({ mesh }) => {
      mesh.visible = false;
    });
    status.hidden = true;
    formationStatus.hidden = true;
  }
  function begin(firstSector) {
    reset();
    intro = firstSector ? SQUAD_INTRO_DURATION : 0;
    player.visible = !intro;
  }
  function activate(kind, energy) {
    const cooldown = kind === 'plasma' ? plasmaCooldown : overdriveCooldown;
    if (
      !canActivateSquadSpecial(kind, {
        playing: true,
        intro: intro > 0,
        energy,
        cooldown,
      })
    )
      return false;
    if (kind === 'plasma') {
      plasmaTime = SQUAD_SPECIALS.plasma.duration;
      plasmaCooldown = SQUAD_SPECIALS.plasma.cooldown;
      plasmaClock = 0;
      beam = [3.5, 1.4].map((radius, i) => {
        const mesh = new T.Mesh(
          new T.CylinderGeometry(radius, radius, 1, 14),
          new T.MeshBasicMaterial({
            color: i ? '#caffff' : '#ff7739',
            transparent: true,
            opacity: i ? 0.78 : 0.3,
            blending: T.AdditiveBlending,
            depthWrite: false,
          }),
        );
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);
        return mesh;
      });
      cue('plasmaTitan');
      notify('PLASMA TITAN · SUPERFEIXE INICIADO');
    } else {
      overdriveTime = SQUAD_SPECIALS.overdrive.duration;
      overdriveCooldown = SQUAD_SPECIALS.overdrive.cooldown;
      overdriveClock = 0;
      overdriveAge = overdriveExit = 0;
      cue('fiveCatsOverdrive');
      notify('FIVE CATS OVERDRIVE · TODOS ÀS ARMAS');
    }
    return SQUAD_SPECIALS[kind].cost;
  }
  function update(dt, { sector, elapsed, pilot, aspect = 1.7, power = 1, playing = true }) {
    if (!playing) return { intro: intro > 0, energySpent: 0 };
    const lang = getLanguage();
    for (const wing of wings) {
      if (wing.label.userData.locale === lang) continue;
      wing.label.material.map = iffTexture(wing.pilot.name, lang);
      wing.label.userData.locale = lang;
      wing.label.material.needsUpdate = true;
    }
    plasmaCooldown = Math.max(0, plasmaCooldown - dt);
    overdriveCooldown = Math.max(0, overdriveCooldown - dt);
    if (intro > 0) {
      const t = SQUAD_INTRO_DURATION - intro;
      wings.forEach(({ pilot: p, mesh }) => {
        const pose = formationPose(p.slot, t);
        const side = p.slot < 0 ? -1 : 1;
        const entering = 1 - Math.min(1, Math.max(0, t / 0.9));
        const leaving = Math.min(1, Math.max(0, (t - SQUAD_INTRO_DURATION + 1.3) / 1.3));
        const smoothLeave = leaving * leaving * (3 - 2 * leaving);
        mesh.visible = true;
        const portrait = aspect < 0.75;
        mesh.scale.setScalar(portrait ? 0.93 : 1.1);
        mesh.position.set(
          player.position.x +
            pose.x * (portrait ? 0.53 : 1) +
            side * (110 * entering + 145 * smoothLeave),
          pose.y + 28 * entering + 72 * smoothLeave,
          player.position.z + pose.z - (portrait ? 12 : 0) - 230 * entering - 260 * smoothLeave,
        );
        mesh.rotation.z = pose.bank - side * (0.5 * entering + 0.78 * smoothLeave);
      });
      player.visible = false;
      formationStatus.hidden = false;
      intro = Math.max(0, intro - dt);
      if (intro === 0) {
        player.visible = true;
        formationStatus.hidden = true;
        wings.forEach(({ mesh }) => {
          mesh.visible = false;
        });
        notify('FIVE CATS · FORMAÇÃO DESFEITA · INICIAR MISSÃO');
      }
      return { intro: true, energySpent: 0 };
    }
    formationStatus.hidden = true;
    status.hidden = plasmaTime <= 0 && overdriveTime <= 0;
    if (plasmaTime > 0) {
      plasmaTime = Math.max(0, plasmaTime - dt);
      status.textContent = 'PLASMA TITAN · ENERGIA CONCENTRADA · ' + Math.ceil(plasmaTime) + 's';
      const origin = player.position.clone().add(new T.Vector3(0, 0, -3));
      const lockedTarget = opponent();
      const forward = lockedTarget ? lockedTarget.clone().sub(origin) : new T.Vector3(0, 0, -200);
      const length = Math.max(5, Math.min(forward.length(), obstacleRange?.() ?? 150, 180));
      const direction = forward.normalize();
      for (const [i, mesh] of beam.entries()) {
        mesh.scale.y = length;
        mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction);
        mesh.position.copy(origin).addScaledVector(direction, length / 2);
        mesh.material.opacity = (i ? 0.77 : 0.27) + Math.sin(elapsed * 26) * 0.05;
      }
      plasmaClock -= dt;
      if (plasmaClock <= 0) {
        // Damage goes through the standard shot collision/occlusion path.
        fireFrom(
          origin,
          lockedTarget ??
            new T.Vector3(player.position.x, player.position.y, player.position.z - 200),
          66 * power,
          'fire',
          true,
          'squad-plasma',
        );
        plasmaClock = SQUAD_SPECIALS.plasma.pulseInterval;
      }
      if (plasmaTime === 0) stopBeam();
    }
    if (overdriveTime > 0 || overdriveExit > 0) {
      const attacking = overdriveTime > 0;
      if (attacking) {
        overdriveTime = Math.max(0, overdriveTime - dt);
        if (overdriveTime === 0) overdriveExit = ALLY_SORTIE_FLIGHT.overdriveExit;
      } else {
        overdriveExit = Math.max(0, overdriveExit - dt);
      }
      overdriveAge += dt;
      status.textContent = attacking
        ? 'FIVE CATS OVERDRIVE · COMBATE EM FORMAÇÃO · ' + Math.ceil(overdriveTime) + 's'
        : 'FIVE CATS · ESQUADRÃO EM RETIRADA';
      overdriveClock -= dt;
      wings.forEach(({ pilot: p, mesh }) => {
        mesh.visible = p.id !== pilot;
        if (!mesh.visible) return;
        const pose = overdriveWingPose(p.slot, overdriveAge, player.position);
        mesh.position.set(pose.x, pose.y, pose.z);
        mesh.rotation.z = pose.bank;
      });
      if (attacking && overdriveAge >= ALLY_SORTIE_FLIGHT.entry && overdriveClock <= 0) {
        const enemy = opponent();
        if (enemy)
          for (const { pilot: p, mesh } of wings) {
            if (p.id !== pilot)
              fireFrom(
                mesh.position.clone(),
                enemy.clone(),
                48 * power,
                'arcane',
                false,
                'squad-overdrive',
              );
          }
        overdriveClock = SQUAD_SPECIALS.overdrive.pulseInterval;
      }
    } else {
      const sortie = sector === 0 ? allySortieFlightAt(elapsed, pilot) : null;
      wings.forEach(({ pilot: p, mesh }) => {
        mesh.visible = !!sortie && sortie.pilot.id === p.id;
        if (mesh.visible) {
          const pose = allySortieFlightPose(sortie, player.position);
          mesh.position.set(pose.x, pose.y, pose.z);
          mesh.rotation.z = pose.bank;
        }
      });
      if (sortie?.phase === 'escort' && opponent()) {
        supportClock -= dt;
        if (supportClock <= 0) {
          const wing = wings.find(({ pilot: p }) => p.id === sortie.pilot.id);
          fireFrom(wing.mesh.position.clone(), opponent(), 4, 'kinetic', false, 'squad-support');
          supportClock = 0.6;
        }
      } else supportClock = 0;
    }
    return { intro: false, energySpent: 0 };
  }
  return {
    begin,
    reset,
    activate,
    update,
    stopBeam,
    snapshot: () => ({
      intro,
      plasmaTime,
      overdriveTime,
      overdriveExit,
      plasmaCooldown,
      overdriveCooldown,
      visible: wings
        .filter(({ mesh }) => mesh.visible)
        .map(({ pilot: p, mesh }) => ({
          pilot: p.id,
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        })),
    }),
    destroy() {
      reset();
      wings.forEach(({ mesh }) => {
        scene.remove(mesh);
        mesh.userData.paint?.forEach((material) => material.dispose());
        mesh.userData.flames?.forEach((flame) => flame.material.dispose());
      });
    },
  };
}
