import * as THREE from "three";
import type { CityCatPose } from "./city-bridge";
import { createCityCatRig } from "./city-cat-rig";

export function createCityCat() {
  const root = new THREE.Group(),
    morph = { value: 0 };
  const model = createCityCatRig(morph);
  root.name = "Milo / high-resolution voxel companion";
  root.visible = false;
  root.add(model.rig);
  root.scale.setScalar(1.8);
  let pose: CityCatPose | null = null,
    heading = 0,
    snapHeading = false,
    curl = 0,
    compression = 0;
  const shadowData = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4,
        distance = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
      shadowData[i] = shadowData[i + 1] = shadowData[i + 2] = 12;
      shadowData[i + 3] = Math.max(0, 1 - distance) ** 2 * 100;
    }
  const shadowTexture = new THREE.DataTexture(shadowData, 64, 64);
  shadowTexture.needsUpdate = true;
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
  });
  const shadowGeometry = new THREE.PlaneGeometry(12, 7),
    shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  root.add(shadow);
  const smooth = (value: number) => {
    const t = THREE.MathUtils.clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  };
  return {
    root,
    setPose(next: CityCatPose | null) {
      pose = next;
      if (!root.visible && next && next.blend > 0.001) snapHeading = true;
      root.visible = !!next && next.blend > 0.001;
      morph.value = next?.blend ?? 0;
    },
    update(
      time: number,
      delta: number,
      camera: THREE.Camera,
      width: number,
      height: number,
      rect: DOMRect,
    ) {
      if (!pose || !root.visible) return;
      const { action, carrying = false, progress = 0.5, jumpPhase, carryPhase } = pose;
      root.position.set(pose.point.x, pose.point.y, pose.point.z);
      if (pose.screen) {
        const depth = root.position.clone().project(camera).z;
        root.position
          .set(
            ((pose.screen.x - rect.left) / width) * 2 - 1,
            1 - ((pose.screen.y - rect.top) / height) * 2,
            depth,
          )
          .unproject(camera);
      }
      const desired = pose.screen
        ? Math.atan2(camera.position.x, camera.position.z) + (pose.facing > 0 ? 0 : Math.PI)
        : pose.heading;
      if (snapHeading) {
        heading = desired;
        snapHeading = false;
      }
      heading +=
        Math.atan2(Math.sin(desired - heading), Math.cos(desired - heading)) *
        (1 - Math.exp(-delta * 7));
      root.rotation.y = heading;
      const walking = action === "walk" || action === "run",
        jumping = action === "jump" || action === "hop";
      const sleeping = action === "sleep",
        resting = sleeping || action === "lie",
        grooming = action === "groom";
      const damping = 1 - Math.exp(-delta * 6);
      curl = THREE.MathUtils.lerp(curl, sleeping ? 1 : 0, 1 - Math.exp(-delta * 3.8));
      const launch = action === "crouch" || jumpPhase === "prepare";
      const landing =
        jumpPhase === "land" ? 1 - smooth(progress) : jumping ? smooth((progress - 0.8) / 0.2) : 0;
      const crouch = launch ? 0.75 + smooth(progress) * 0.25 : landing;
      compression = THREE.MathUtils.lerp(compression, crouch, 1 - Math.exp(-delta * 13));
      const pace = time * (action === "run" ? 12 : 6);
      const swatting = action === "swat",
        swipe = swatting ? Math.sin(smooth((progress - 0.1) / 0.7) * Math.PI) : 0;
      const sit = action === "sit" || grooming || swatting;
      model.legs.forEach((leg, index) => {
        const beat = Math.sin(pace + (index === 0 || index === 3 ? 0 : Math.PI));
        let target = walking
          ? beat * 0.4
          : jumping
            ? index < 2
              ? -0.7
              : 0.45
            : resting
              ? index < 2
                ? 1.08
                : -0.82
              : sit && index < 2
                ? 0.95
                : 0;
        if (grooming && index === 3) target = 1.8 + Math.sin(time * 3) * 0.05;
        if (swatting && index === 3) target = swipe * 1.6;
        if (launch) target = compression * (index < 2 ? 0.95 : -0.34);
        leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, target, damping);
        leg.rotation.y = THREE.MathUtils.lerp(
          leg.rotation.y,
          swatting && index === 3 ? -swipe * 0.35 : index < 2 ? curl * 0.28 : -curl * 0.3,
          damping,
        );
        const planted = launch || (sit && index < 2);
        const hipY = planted
          ? 0.25 + 2.38 * Math.cos(leg.rotation.z) - 0.2 * Math.sin(leg.rotation.z)
          : 2.75 - compression * 0.62 - (resting ? 0.8 : 0);
        leg.position.y = THREE.MathUtils.lerp(leg.position.y, hipY, damping);
        leg.scale.y = THREE.MathUtils.lerp(
          leg.scale.y,
          resting ? 0.72 : launch ? 1 : 1 - compression * 0.16,
          damping,
        );
      });
      const breath = Math.sin(time * (sleeping ? 1.6 : 2.2)) * (sleeping ? 0.045 : 0.025);
      model.body.scale.set(
        1 - curl * 0.12 + compression * 0.05,
        1 - (resting ? 0.28 : 0) - compression * 0.13 + breath * 0.16,
        1 + curl * 0.13,
      );
      model.body.position.y = THREE.MathUtils.lerp(
        model.body.position.y,
        resting ? -0.95 : sit ? -0.36 : -compression * 0.9,
        damping,
      );
      model.body.rotation.z = THREE.MathUtils.lerp(
        model.body.rotation.z,
        swatting ? swipe * 0.1 : action === "stretch" ? -0.11 : launch ? compression * 0.12 : 0,
        damping,
      );
      let headY = sleeping
        ? 1.75
        : resting
          ? 2.35
          : 4.5 - (sit ? 0.32 : 0) - compression * 0.8 + breath;
      let jawOpen = 0;
      const gripHeadY = 0.656 + ((pose.carRoofHeight ?? 1.5) + 0.14 - pose.point.y) / 1.8;
      if (carryPhase === "grab") {
        const lower = smooth(progress / 0.35),
          lift = smooth((progress - 0.68) / 0.32);
        headY = 4.5 + lower * (gripHeadY - 4.5) + lift * (3.15 - gripHeadY);
        jawOpen = smooth(progress / 0.3) * (1 - smooth((progress - 0.4) / 0.2));
      } else if (carryPhase === "walk") headY = 3.15 + breath;
      else if (carryPhase === "drop") {
        headY =
          3.15 +
          smooth(progress / 0.65) * (gripHeadY - 3.15) +
          smooth((progress - 0.8) / 0.2) * (4.15 - gripHeadY);
        jawOpen = smooth((progress - 0.65) / 0.12) * (1 - smooth((progress - 0.88) / 0.12));
      }
      model.jaw.rotation.z = -jawOpen * 0.42;
      model.head.position.lerp(
        new THREE.Vector3(sleeping ? 1.65 : 2.25, headY, sleeping ? 1.08 : 0),
        carryPhase ? 1 - Math.exp(-delta * 16) : damping,
      );
      model.head.rotation.y = THREE.MathUtils.lerp(
        model.head.rotation.y,
        sleeping ? -0.55 : walking || jumping || carrying ? 0 : Math.sin(time * 0.65) * 0.13,
        damping,
      );
      model.head.rotation.z = THREE.MathUtils.lerp(
        model.head.rotation.z,
        carryPhase
          ? -0.1
          : sleeping
            ? -0.16
            : grooming
              ? -0.22 + Math.sin(time * 3) * 0.04
              : jumping
                ? 0.15 * Math.sin(progress * Math.PI)
                : -0.08 * compression,
        damping,
      );
      model.neck.position.y = THREE.MathUtils.lerp(
        model.neck.position.y,
        resting ? 2.05 : carryPhase ? headY * 0.65 + 0.5 : 3.65 - compression * 0.5,
        damping,
      );
      model.neck.scale.y = THREE.MathUtils.lerp(
        model.neck.scale.y,
        resting ? 0.58 : carryPhase ? 0.85 : 1,
        damping,
      );
      model.collar.position.y = model.neck.position.y;
      model.tag.position.y = model.neck.position.y - 0.37;
      model.rig.rotation.z = THREE.MathUtils.lerp(
        model.rig.rotation.z,
        jumping ? -0.14 * Math.sin(progress * Math.PI) : 0,
        damping,
      );
      model.rig.rotation.y = THREE.MathUtils.lerp(model.rig.rotation.y, curl * 0.18, damping);
      const blink = time % 6.7 > 6.45;
      model.eyes.forEach((eye) => {
        eye.visible = curl < 0.6;
        eye.scale.y = blink ? 0.1 : 1;
      });
      model.closedEyes.forEach((eye) => {
        eye.visible = curl >= 0.6;
      });
      model.updateTail(time, curl);
      root.userData.voxelCount = model.voxelCount;
      shadowMaterial.opacity = pose.blend * (jumping ? 0.24 : 0.78);
      shadow.scale.setScalar(resting ? 0.85 : jumping ? 0.72 : 1);
    },
    grip() {
      root.updateMatrixWorld(true);
      const point = model.mouth.getWorldPosition(new THREE.Vector3());
      return { point: { x: point.x, y: point.y, z: point.z }, heading };
    },
    dispose() {
      model.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      root.clear();
    },
  };
}
