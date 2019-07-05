import { Mesh, Scene } from "three";
import InstancedMeshGroup from "./InstancedMeshGroup";
import GeometryFactory from "./GeometryFactory";
import { Actor } from "satisfactory-json";
import ColorFactory from "./ColorFactory";
import {
  isRailroadTrack,
  isConveyorBelt,
  isPowerLine
} from "@/helpers/entityHelper";

/**
 * Interface for Meshes
 * This can be either a wrapper around a usual THREE.Mesh or points to a node in an InstancedMesh
 */
export interface ModelMesh {
  getPathName(): string;
  getRaycastMesh(): Mesh;

  // TODO replace with setVisible?
  addToScene(scene: Scene): void;
  removeFromScene(scene: Scene): void;

  rebuildGeometry(actor: Actor, geometryFactory: GeometryFactory): void;
  rebuildColor(actor: Actor, colorFactory: ColorFactory): void;

  dispose(): void;
  setSelected(selected: boolean): void;
  applyTransformToActor(actor: Actor): Actor;
}

export class ThreeModelMesh implements ModelMesh {
  private mesh: Mesh;
  constructor(mesh: Mesh) {
    this.mesh = mesh;
  }

  getPathName(): string {
    return this.mesh.userData.pathName;
  }

  getRaycastMesh(): Mesh {
    return this.mesh;
  }

  addToScene(scene: Scene): void {
    scene.add(this.mesh);
  }
  removeFromScene(scene: Scene): void {
    scene.remove(this.mesh);
  }

  rebuildGeometry(actor: Actor, geometryFactory: GeometryFactory): void {
    geometryFactory
      .createGeometry(actor)
      .then(result => (this.mesh.geometry = result.geometry));
  }

  rebuildColor(actor: Actor, colorFactory: ColorFactory): void {}

  dispose(): void {
    // TODO remove from scene if visible
  }

  setSelected(selected: boolean): void {
    // TODO set correct color
  }

  applyTransformToActor(actor: Actor): Actor {
    // TODO need to clone, else change is not detected?
    // find more intelligent way
    var clone = Object.assign({}, actor);
    // switched to accord for coordinate system change!
    clone.transform.translation[1] = this.mesh.position.x;
    clone.transform.translation[0] = this.mesh.position.y;
    clone.transform.translation[2] = this.mesh.position.z;

    if (
      !isConveyorBelt(actor) &&
      !isRailroadTrack(actor) &&
      !isPowerLine(actor)
    ) {
      this.mesh.rotateZ(-1.5708); // -90 deg in radians
    } // TODO conveyor belt coordinates are given without rotation?
    clone.transform.rotation[0] = this.mesh.quaternion.x;
    clone.transform.rotation[1] = this.mesh.quaternion.y;
    clone.transform.rotation[2] = -this.mesh.quaternion.z;
    clone.transform.rotation[3] = this.mesh.quaternion.w;

    clone.transform.scale3d[0] = this.mesh.scale.x;
    clone.transform.scale3d[1] = this.mesh.scale.y;
    clone.transform.scale3d[2] = this.mesh.scale.z;
    return clone;
  }
}

export class InstancedModelMesh implements ModelMesh {
  private instancedMeshGroup: InstancedMeshGroup;
  private index: number;
  private raycastMesh: Mesh;
  constructor(
    instancedMeshGroup: InstancedMeshGroup,
    index: number,
    raycastMesh: Mesh
  ) {
    this.instancedMeshGroup = instancedMeshGroup;
    this.index = index;
    this.raycastMesh = raycastMesh;
  }

  getPathName(): string {
    return this.raycastMesh.userData.pathName;
  }

  getRaycastMesh(): Mesh {
    return this.raycastMesh;
  }

  addToScene(scene: Scene): void {
    // TODO
  }
  removeFromScene(scene: Scene): void {
    // TODO
  }

  rebuildGeometry(actor: Actor, geometryFactory: GeometryFactory): void {
    // TODO
  }

  rebuildColor(actor: Actor, colorFactory: ColorFactory): void {
    // TODO set color for this node in the InstancedMeshGroup
  }

  dispose(): void {
    // TODO
  }

  setSelected(selected: boolean): void {
    // TODO change color
  }

  applyTransformToActor(actor: Actor): Actor {
    // TODO
    return actor;
  }
}