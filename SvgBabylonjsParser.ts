import { GreasedLineTools, CreateGreasedLine, Vector3, Scene, Curve3, Color3, GreasedLineMeshColorDistribution } from "@babylonjs/core";
import parse from "parse-svg-path";

interface SvgElement {
    children: any[];
    properties: any;
    tagName: string;
    type: string;
}

let pointsGR: Vector3[][] = [];
let colorsGR: Color3[] = [];
const scale = 0.005;
const width = 0.05;
const functionMap = new Map<string, Function>();
functionMap.set("circle", addCircle);

export function parseSvgFromJson(svg: any, scene: Scene) {
    for(let element of svg.children) {
        parseElement(element);
    }

    // colorsGR = [];
    // pointsGR.forEach((pp) => {
    //     pp.forEach((p) => {
    //         colorsGR.push(new Color3(1, 0, 0));
    //     })
    // });
    const line1 = CreateGreasedLine(
        'line-1',
        {
            points: pointsGR,
        },
        {
            width: width,
            colors: colorsGR,
            useColors: true,
            colorDistribution: GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_EVEN
        },
        scene
    )
    // console.log(colorsGR);
    // console.log(pointsGR)

    return line1;

    // line1.getBoundingInfo().update(line1.computeWorldMatrix());
    // const bboxSize = line1.getBoundingInfo().boundingBox.extendSizeWorld;
    // line1.position.x -= bboxSize.x;
    // line1.position.y += bboxSize.y;
}

const strokeColorStack: Color3[] = [Color3.Black()];
const strokeWidthStack: number[] = [1];
const rgbRegex = /rgb\((?<r>\d{1,3}),(?<g>\d{1,3}),(?<b>\d{1,3})\)/;
function parseElement(element:SvgElement) {


    if(element.tagName === "clipPath" || element.tagName === "defs") {
        return; //hack, skip clip path and defs for now since we dont have any in the test SVG
    }

    if(element.properties?.stroke-width) {
        strokeWidthStack.push(element.properties.stroke-width);
    }
    if(element.properties?.stroke) {
        var rgb = rgbRegex.exec(element.properties.stroke);
        if(rgb?.groups?.r && rgb?.groups?.g && rgb?.groups?.b) {
            strokeColorStack.push(new Color3(Number.parseFloat(rgb.groups.r) / 255, Number.parseFloat(rgb.groups.g) / 255, Number.parseFloat(rgb.groups.b) / 255));
        } else {
            console.warn("Failed to add color!");
        }
    }

    if(element.tagName === "circle") {
        pointsGR.push(functionMap.get(element.tagName)!(element));
    } else if(element.tagName === "path") {
        const path = parse(element.properties.d);

        const newPoints = handlePath(path);

        newPoints.forEach((p, i) => {
            colorsGR.push(strokeColorStack[strokeColorStack.length - 1]);
        });
        
        pointsGR.push(newPoints);
    } else if(element.tagName === "polyline") {
        const newPoints = handlePolyline(element.properties.points);
        
        newPoints.forEach((p, i) => {
            colorsGR.push(strokeColorStack[strokeColorStack.length - 1]);
        });
        pointsGR.push(newPoints);
    } else if(element.tagName === "g") {

        // console.log(element);
    } else {
        console.log(`Unhandled element tagname: ${element.tagName}`);
        // console.log(element);
    }

    element.children?.forEach((c: any) => {
        parseElement(c);
    });

    if(element.properties?.stroke && strokeColorStack.length > 1) {
        strokeColorStack.pop();
    }
}


//-----------------------------------------------------------------------

function addCircle(element: SvgElement): Vector3[] {
    const points = GreasedLineTools.GetCircleLinePoints(element.properties.r * scale, 100);
    points.forEach((p) => {
        p.addInPlaceFromFloats(element.properties.cx * scale, -element.properties.cy * scale, 0);
    });
    return points;
}

function handlePolyline(points: string) {
    let vec3Points: Vector3[] = []
    let pointsSplit = points.split(" ");
    pointsSplit.forEach((point) =>  {
        let coords = point.split(",");
        if(coords.length > 1) {
            vec3Points.push(new Vector3(Number.parseFloat(coords[0]) * scale, -Number.parseFloat(coords[1]) * scale, 0))
        }
    })
    return vec3Points;
}


const tmpVec1 = Vector3.Zero();
const tmpVec2 = Vector3.Zero();
const tmpVec3 = Vector3.Zero();
function handlePath(path: any) {
    var points: Vector3[] = [];
    path.forEach((arr: any) => {
        if(arr[0] === "M" || arr[0] === "L") {
            points.push(new Vector3(arr[1] * scale, -arr[2] * scale, 0));
        }
        else if(arr[0] === "l") {
            points.push(new Vector3(arr[1] * scale, -arr[2] * scale, 0).addInPlace(points[points.length - 1]));
        }
        else if(arr[0] === "q") {
            tmpVec1.x = arr[1] * scale;
            tmpVec1.y = -arr[2] * scale;
            tmpVec1.z = 0;

            tmpVec2.x = arr[3] * scale;
            tmpVec2.y = -arr[4] * scale;
            tmpVec2.z = 0;
            const arc = Curve3.CreateQuadraticBezier(points[points.length - 1], points[points.length -  1].add(tmpVec1), points[points.length -  1].add(tmpVec2), 100);
            points.push(...arc.getPoints());
        } else if(arr[0] === "Q") {
            tmpVec1.x = arr[1] * scale;
            tmpVec1.y = -arr[2] * scale;
            tmpVec1.z = 0;

            tmpVec2.x = arr[3] * scale;
            tmpVec2.y = -arr[4] * scale;
            tmpVec2.z = 0;
            const arc = Curve3.CreateQuadraticBezier(points[points.length - 1], tmpVec1, tmpVec2, 100);
            points.push(...arc.getPoints());
        } else if(arr[0].toLowerCase() === "z") {
            points.push(points[0]);
        } else {
            console.log(`Unhandled path syntax: ${arr[0]}`);
        }
    });
    return points;
}