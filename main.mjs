'use strict';
import Light from "./fglight.mjs";
import Model from "./fgmodel.mjs";
import TrackballRotator from "./Utils/trackball-rotator.mjs";
import TexCoordDrawer from "./Texture.mjs";

let gl;                         // The webgl context.
let surface;                    // A surface model
let lightSurface;               // A light surface model
let shProgram;                  // A shader program
let shLightProgram;             // A light shader program
let spaceball;    
let uvDrawer;
         

let zoomFactor = -10;
const zoomStep = 1;
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
let lightU = document.getElementById('lightU').value;
let lightV = document.getElementById('lightV').value;  

// Constructor for ShaderProgram
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iProjectionMatrix = -1
    this.iModelMatrix = -1
    
    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

/* Draws the scene */
function draw() {

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    let lightLocation = lightSurface.getLocation(lightU, lightV);

    let projection = m4.perspective(Math.PI / 8, 1, 0.1, 100);
    let trackballView = spaceball.getViewMatrix();
    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, zoomFactor);

    let modelMatrix = m4.multiply(translateToPointZero, m4.multiply(rotateToPointZero, trackballView));
    
    let lightModel = m4.translation(lightLocation[0], lightLocation[1], lightLocation[2]);
    lightModel = m4.multiply(trackballView, lightModel);
    lightModel = m4.multiply(rotateToPointZero, lightModel);
    lightModel = m4.multiply(translateToPointZero, lightModel);

    shProgram.Use();

    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, modelMatrix);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
    gl.uniform4fv(shProgram.iLightLocation, m4.transformVector(lightModel, [0.0, 0.0, 0.0, 1.0], []));        
    gl.uniform1i(shProgram.iDiffuseTexture, 0);
    gl.uniform1i(shProgram.iNormalTexture, 1);
    gl.uniform1i(shProgram.iSpecularTexture, 2);
    
    surface.Draw();

    shLightProgram.Use();

    gl.uniformMatrix4fv(shLightProgram.iModelMatrix, false, lightModel);
    gl.uniformMatrix4fv(shLightProgram.iProjectionMatrix, false, projection);
    lightSurface.Draw();

    uvDrawer.draw();
}

/* Initialize the WebGL context */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    let progLight = createProgram(gl, vertexLightShaderSource, fragmentLightShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shLightProgram = new ShaderProgram('Light', progLight);

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "in_vertex");
    shProgram.iAttribNormal = 1;
    shProgram.iAttribTangent = 2;
    shProgram.iAttribUV = 3;
    shProgram.iModelMatrix = gl.getUniformLocation(prog, "model");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "projection");
    shProgram.iLightLocation = gl.getUniformLocation(prog, "light_location");
    
    shProgram.iDiffuseTexture = gl.getUniformLocation(prog, "diffuse_texture");
    shProgram.iNormalTexture = gl.getUniformLocation(prog, "normal_texture");
    shProgram.iSpecularTexture = gl.getUniformLocation(prog, "specular_texture");

    shProgram.iPoint = gl.getUniformLocation(prog, "point");
    shProgram.iAngle = gl.getUniformLocation(prog, "angle");

    shLightProgram.iAttribVertex = gl.getAttribLocation(progLight, "in_vertex");
    shLightProgram.iProjectionMatrix = gl.getUniformLocation(progLight, "projection");;
    shLightProgram.iModelMatrix = gl.getUniformLocation(progLight, "model");

    surface = new Model(gl, shProgram);
    surface.CreateSurfaceData();

    lightSurface = new Light(gl, shLightProgram, lightU, lightV);

    gl.enable(gl.DEPTH_TEST);

    uvDrawer = new TexCoordDrawer(surface);
    uvDrawer.init();
}

/* Creates a program */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }

    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function update(){
    surface.CreateSurfaceData();
    uvDrawer.update();
    draw();
}

zoomIn.addEventListener('click', () => {
    zoomFactor += zoomStep;
    draw();
});

zoomOut.addEventListener('click', () => {
    zoomFactor -= zoomStep;
    draw();
});

document.getElementById('lightU').addEventListener('input', (event) => {
    lightU = parseFloat(event.target.value);
 
    draw();
});

document.getElementById('lightV').addEventListener('input', (event) => {
    lightV = parseFloat(event.target.value);

    draw();
});

document.getElementById('circleCount').addEventListener('change', update);
document.getElementById('segmentsCount').addEventListener('change', update);
document.getElementById('Angle').addEventListener('input', draw);
document.addEventListener('draw', draw)

/* Initialize the app */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl2");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL();
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}

document.addEventListener("DOMContentLoaded", init);
