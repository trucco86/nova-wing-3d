import * as T from 'three';
import {
  SQUAD_PILOTS,
  SQUAD_INTRO_DURATION,
  SQUAD_SPECIALS,
  formationPose,
  allySortieAt,
  canActivateSquadSpecial,
} from './five-cats-squad.js';

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
}) {
  const wings = SQUAD_PILOTS.map((pilot) => {
    const mesh = createWing(pilot);
    mesh.visible = false;
    scene.add(mesh);
    return { pilot, mesh };
  });
  let intro = 0;
  let plasmaTime = 0,
    overdriveTime = 0,
    plasmaCooldown = 0,
    overdriveCooldown = 0;
  let plasmaClock = 0,
    overdriveClock = 0,
    supportClock = 0;
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
      cue('fiveCatsOverdrive');
      notify('FIVE CATS OVERDRIVE · TODOS ÀS ARMAS');
    }
    return SQUAD_SPECIALS[kind].cost;
  }
  function update(dt, { sector, elapsed, pilot, aspect = 1.7, power = 1, playing = true }) {
    if (!playing) return { intro: intro > 0, energySpent: 0 };
    plasmaCooldown = Math.max(0, plasmaCooldown - dt);
    overdriveCooldown = Math.max(0, overdriveCooldown - dt);
    if (intro > 0) {
      const t = SQUAD_INTRO_DURATION - intro;
      wings.forEach(({ pilot: p, mesh }) => {
        const pose = formationPose(p.slot, t);
        mesh.visible = true;
        const portrait = aspect < 0.75;
        mesh.scale.setScalar(portrait ? 0.93 : 1.1);
        mesh.position.set(
          player.position.x + pose.x * (portrait ? 0.53 : 1),
          pose.y,
          player.position.z + pose.z - (portrait ? 12 : 0),
        );
        mesh.rotation.z = pose.bank;
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
      const forward = lockedTarget
        ? lockedTarget.clone().sub(origin)
        : new T.Vector3(0, 0, -200);
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
          lockedTarget ?? new T.Vector3(player.position.x, player.position.y, player.position.z - 200),
          66 * power,
          'fire',
          true,
          'squad-plasma',
        );
        plasmaClock = SQUAD_SPECIALS.plasma.pulseInterval;
      }
      if (plasmaTime === 0) stopBeam();
    }
    if (overdriveTime > 0) {
      overdriveTime = Math.max(0, overdriveTime - dt);
      status.textContent = 'FIVE CATS OVERDRIVE · COMBATE EM FORMAÇÃO · ' + Math.ceil(overdriveTime) + 's';
      overdriveClock -= dt;
      wings.forEach(({ pilot: p, mesh }) => {
        mesh.visible = p.id !== pilot;
        if (!mesh.visible) return;
        const pose = formationPose(p.slot, SQUAD_INTRO_DURATION);
        mesh.position.set(
          player.position.x + pose.x * 0.8,
          player.position.y + pose.y - 7,
          player.position.z + pose.z + 12,
        );
        mesh.rotation.z = pose.bank;
      });
      if (overdriveClock <= 0) {
        const enemy = opponent();
        if (enemy)
          for (const { pilot: p, mesh } of wings) {
            if (p.id !== pilot)
              fireFrom(mesh.position.clone(), enemy.clone(), 48 * power, 'arcane', false, 'squad-overdrive');
          }
        overdriveClock = SQUAD_SPECIALS.overdrive.pulseInterval;
      }
      if (overdriveTime === 0)
        wings.forEach(({ mesh }) => {
          mesh.visible = false;
        });
    } else {
      const sortie = sector === 0 ? allySortieAt(elapsed, pilot) : null;
      wings.forEach(({ pilot: p, mesh }) => {
        mesh.visible = !!sortie && sortie.pilot.id === p.id;
        if (mesh.visible) {
          const direction = sortie.section % 2 ? 1 : -1;
          mesh.position.set(
            player.position.x + direction * 16,
            player.position.y + 3,
            player.position.z - 10 - sortie.seconds * 2,
          );
          mesh.rotation.z = -direction * 0.12;
        }
      });
      if (sortie && opponent()) {
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
