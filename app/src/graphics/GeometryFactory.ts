import { modelConfig } from "@/definitions/models";
import {
  findActorByName,
  getProperty,
  isConveyorBelt,
  isPowerLine,
  findComponentByName
} from "@/helpers/entityHelper";
import { modelHelper } from "@/helpers/modelHelper";
import { ConveyorCurvePath } from "@/js/ConveyorCurvePath";
import * as Sentry from "@sentry/browser";
import {
  Actor,
  ArrayProperty,
  Component,
  ObjectProperty
} from "satisfactory-json";
import {
  BoxBufferGeometry,
  BufferGeometry,
  CubicBezierCurve3,
  LineCurve3,
  Quaternion,
  TubeBufferGeometry,
  Vector3,
  ExtrudeBufferGeometry,
  Shape
} from "three";

/**
 * Factory that creates and caches geometry
 */
export default class GeometryFactory {
  geometries: { [id: string]: BufferGeometry } = {};
  // properties
  showModels: boolean;
  conveyorBeltResolution: number;

  constructor(showModels: boolean, conveyorBeltResolution: number) {
    this.showModels = showModels;
    this.conveyorBeltResolution = conveyorBeltResolution;
  }

  createGeometry(actor: Actor): Promise<BufferGeometry> {
    var className = actor.className;

    return new Promise((resolve, reject) => {
      if (!this.showModels) {
        // return single sized cube
        if (this.geometries["box"] === undefined) {
          // 800 is size of foundations
          this.geometries["box"] = this.createBoxGeometry(400);
        }
        resolve(this.geometries["box"]);
        return;
      }

      // special cases for geometry
      if (isConveyorBelt(actor)) {
        resolve(this.createConveyorBeltGeometry(actor));
        return;
      }
      if (isPowerLine(actor)) {
        resolve(this.createPowerLineGeometry(actor));
        return;
      }

      if (
        actor.className ===
        "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Build_ConveyorPole.Build_ConveyorPole_C"
      ) {
        // Conveyor Pole
        const poleMesh = getProperty(actor, "mPoleMesh") as ObjectProperty;
        if (poleMesh !== undefined) {
          switch (poleMesh.value.pathName) {
            case "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Mesh/ConveyorPole_01_static.ConveyorPole_01_static":
              break;
            case "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Mesh/ConveyorPole_02_static.ConveyorPole_02_static":
              className =
                "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Build_ConveyorPole.Build_ConveyorPole_2";
              break;
            case "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Mesh/ConveyorPole_03_static.ConveyorPole_03_static":
              className =
                "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Build_ConveyorPole.Build_ConveyorPole_3";
              break;
            case "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Mesh/ConveyorPole_04_static.ConveyorPole_04_static":
              className =
                "/Game/FactoryGame/Buildable/Factory/ConveyorPole/Build_ConveyorPole.Build_ConveyorPole_4";
              break;
          }
        }
      }

      if (this.geometries[className] === undefined) {
        if (
          modelConfig[className] !== undefined &&
          modelConfig[className].model !== ""
        ) {
          modelHelper
            .loadModel("/models/" + modelConfig[className].model)
            .then(geometry => {
              this.geometries[className] = geometry;
              resolve(this.geometries[className]);
            });
        } else {
          if (modelConfig[className] === undefined) {
            console.error("missing model definition: " + className);
            Sentry.captureMessage("missing model definition: " + className);
          }

          // 800 is size of foundations

          this.geometries[className] = this.createBoxGeometry(200);
          resolve(this.geometries[className]);
        }
      } else {
        resolve(this.geometries[className]);
      }
    });
  }

  createConveyorBeltGeometry(actor: Actor) {
    const splineData = getProperty(actor, "mSplineData") as ArrayProperty;
    //actor.entity!.properties[0]; // TODO actually search for mSplineData as it might not be the first

    const splinePoints = splineData.value.values.length;

    const extrudePath = new ConveyorCurvePath<Vector3>();

    var lastLoc = null;
    var lastLeave = null;

    for (let i = 0; i < splinePoints; i++) {
      const splinePoint = splineData.value.values[i];
      const location = splinePoint.properties[0]; // TODO make sure this is Location
      const arriveTangent = splinePoint.properties[1]; // TODO make sure this is arriveTangent
      const leaveTangent = splinePoint.properties[2]; // TODO make sure this is leaveTangent

      if (lastLoc != null) {
        // TODO find out how exactly to use arriveTangent and leaveTangent
        // I'm still not 100% sure, how the tangents in Unreal are calculated. The division by three is still a guess and based on the first answer here: https://answers.unrealengine.com/questions/330317/which-algorithm-is-used-for-spline-components-in-u.html#
        extrudePath.add(
          new CubicBezierCurve3(
            new Vector3(lastLoc.value.y, lastLoc.value.x, lastLoc.value.z),
            new Vector3(
              lastLoc.value.y + lastLeave.value.y / 3,
              lastLoc.value.x + lastLeave.value.x / 3,
              lastLoc.value.z + lastLeave.value.z / 3
            ),
            new Vector3(
              location.value.y - arriveTangent.value.y / 3,
              location.value.x - arriveTangent.value.x / 3,
              location.value.z - arriveTangent.value.z / 3
            ),
            new Vector3(location.value.y, location.value.x, location.value.z)
          )
        );
      }

      lastLoc = location;
      lastLeave = leaveTangent;
    }

    var length = 38,
      width = 180;
    var shape = new Shape();
    shape.moveTo(-length / 2, -width / 2);
    shape.lineTo(-length / 2, width / 2);
    shape.lineTo(length / 2, width / 2);
    shape.lineTo(length / 2, -width / 2);
    shape.lineTo(-length / 2, -width / 2);

    var extrudeSettings = {
      // TODO find better values for this?
      curveSegments: (splinePoints * this.conveyorBeltResolution) / 2,
      steps: splinePoints * this.conveyorBeltResolution,
      bevelEnabled: false,
      extrudePath: extrudePath
    };

    return new ExtrudeBufferGeometry(shape, extrudeSettings);
  }

  createPowerLineGeometry(actor: Actor) {
    const sourceConnection = findComponentByName(
      actor.entity!.extra.sourceLevelName,
      actor.entity!.extra.sourcePathName
    );
    if (sourceConnection === undefined) {
      // TODO error
      console.error(
        "source connection of power line " +
          actor.entity!.extra.sourcePathName +
          " not found."
      );
      return;
    }
    const targetConnection = findComponentByName(
      actor.entity!.extra.targetLevelName,
      actor.entity!.extra.targetPathName
    );
    if (targetConnection === undefined) {
      // TODO error
      console.error(
        "target connection of power line " +
          actor.entity!.extra.targetPathName +
          " not found."
      );
      return;
    }

    const source = findActorByName(
      sourceConnection.levelName,
      sourceConnection.outerPathName
    );
    if (source === undefined) {
      // TODO error
      console.error(
        "source of power line " + sourceConnection.outerPathName + " not found."
      );
      return;
    }

    const target = findActorByName(
      targetConnection.levelName,
      targetConnection.outerPathName
    );
    if (target === undefined) {
      // TODO error
      console.error(
        "target of power line " + targetConnection.outerPathName + " not found."
      );
      return;
    }
    var sourceOffset = { x: 0, y: 0, z: 0 };
    if (modelConfig[source.className].powerLineOffset !== undefined) {
      sourceOffset = modelConfig[source.className].powerLineOffset!;
      const transformedSourceOffset = new Vector3(
        sourceOffset.y,
        sourceOffset.x,
        sourceOffset.z
      ).applyQuaternion(
        new Quaternion(
          source.transform.rotation[0],
          source.transform.rotation[1],
          -source.transform.rotation[2],
          source.transform.rotation[3]
        )
      );
      sourceOffset = {
        x: transformedSourceOffset.x,
        y: transformedSourceOffset.y,
        z: transformedSourceOffset.z
      };
    }
    var targetOffset = { x: 0, y: 0, z: 0 };
    if (modelConfig[target.className].powerLineOffset !== undefined) {
      targetOffset = modelConfig[target.className].powerLineOffset!;
      const transformedTargetOffset = new Vector3(
        targetOffset.y,
        targetOffset.x,
        targetOffset.z
      ).applyQuaternion(
        new Quaternion(
          target.transform.rotation[0],
          target.transform.rotation[1],
          -target.transform.rotation[2],
          target.transform.rotation[3]
        )
      );
      targetOffset = {
        x: transformedTargetOffset.x,
        y: transformedTargetOffset.y,
        z: transformedTargetOffset.z
      };
    }

    const extrudePath = new LineCurve3(
      new Vector3(
        source.transform.translation[1] -
          actor.transform.translation[1] +
          sourceOffset.x,
        source.transform.translation[0] -
          actor.transform.translation[0] +
          sourceOffset.y,
        source.transform.translation[2] -
          actor.transform.translation[2] +
          sourceOffset.z
      ),
      new Vector3(
        target.transform.translation[1] -
          actor.transform.translation[1] +
          targetOffset.x,
        target.transform.translation[0] -
          actor.transform.translation[0] +
          targetOffset.y,
        target.transform.translation[2] -
          actor.transform.translation[2] +
          targetOffset.z
      )
    );

    const extrusionSegments = 1;
    const radius = 10;
    const radiusSegments = 3;
    const closed = false;

    return new TubeBufferGeometry(
      extrudePath,
      extrusionSegments,
      radius,
      radiusSegments,
      closed
    );
  }

  createBoxGeometry(size: number): BoxBufferGeometry {
    return new BoxBufferGeometry(size, size, size);
  }
}
