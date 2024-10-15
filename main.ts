import { ArcRotateCamera, Color3, CreateGreasedLine, Engine, FramingBehavior, HemisphericLight, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import { parse } from 'svg-parser';
import { parseSvgFromJson } from "./SvgBabylonjsParser";

async function main() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // Get the canvas element
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new Vector3(0, 0, 0));
  var b = new FramingBehavior();
  camera.addBehavior(b, true);
  camera.attachControl(canvas, true);
  const light = new HemisphericLight("light", new Vector3(1, 1, 0));
  
  let a = MeshBuilder.CreateBox("asd");


  
  
  //   const parsed = parse( `
  // <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
  //    <circle cx="100" cy="50" r="40" stroke="black" stroke-width="2" fill="none" />
  //   <path id="lineAB" d="M 100 350 l 150 -300" stroke="red" stroke-width="4"/>
  //   <path id="lineBC" d="M 250 50 l 150 300" stroke="red" stroke-width="4"/>
  //   <path id="lineMID" d="M 175 200 l 150 0" stroke="green" stroke-width="4"/>
  //   <path id="lineAC" d="M 100 350 q 150 -200 300 0" stroke="blue" fill="none" stroke-width="4"/>
  
  // <!-- Mark relevant points -->
  //   <g stroke="black" stroke-width="3" fill="black">
  //     <circle id="pointA" cx="100" cy="350" r="4" />
  //     <circle id="pointB" cx="250" cy="50" r="4" />
  //     <circle id="pointC" cx="400" cy="350" r="4" />
  //   </g>
  // </svg> 
  // ` );
  
  const r = await fetch("/dist/sampleSVGVB.svg");
  const svg = await r.text();
  
  console.log(svg);
  const parsed = parse(svg);
  
  const lineMesh = parseSvgFromJson(parsed, scene);
  lineMesh.renderingGroupId = 1;
  camera.setTarget(lineMesh);
  camera.beta = 1.57079633;



// let points1 = [];
// for (let x = 0; x < 10; x += 0.25) {
//   points1.push(new Vector3(x, Math.cos(x / 2) - 2, 0))
// }
// const widths = [1, 2, 4, 8]
// const line1 = CreateGreasedLine(
//   'basic-line-1',
//   {
//       points: points1,
//       widths,
//   },
//   {
//       color: Color3.Red(),
//   },
//   scene
// )
  engine.runRenderLoop(function () {
    scene.render();
  });

  return scene;
};

main();