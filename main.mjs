'use strict';

// Import required modules
import Light from "./fgLight.mjs";
import Model from "./fgModel.mjs";
import TrackballRotator from "./Utils/trackball-rotator.mjs";

// Global variables
let gl;                          // WebGL context
let modelSurface;                // Model surface object
let lightModelSurface;           // Light surface object
let shaderProgram;               // Shader program for basic rendering
let lightShaderProgram;          // Shader program for light rendering
let trackballRotator;            // Trackball for rotating the view
let zoomLevel = -10;             // Initial zoom level
const zoomIncrement = 1;         // Zoom step value
const zoomInButton = document.getElementById('zoomIn');  // Zoom-in button element
const zoomOutButton = document.getElementById('zoomOut'); // Zoom-out button element
let lightPositionU = document.getElementById('lightU').value;  // Light U position
let lightPositionV = document.getElementById('lightV').value;  // Light V position

// Shader program constructor
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    // Uniform and attribute locations
    this.iAttribVertex = -1;
    this.iProjectionMatrix = -1;
    this.iModelMatrix = -1;

    // Use the shader program
    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

// Main drawing function
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Calculate light location based on inputs
    let lightLocation = lightModelSurface.getLocation(lightPositionU, lightPositionV);

    // Prepare transformation matrices
    let projectionMatrix = m4.perspective(Math.PI / 8, 1, 0.1, 100);
    let viewMatrix = trackballRotator.getViewMatrix();
    let rotationMatrix = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translationMatrix = m4.translation(0, 0, zoomLevel);
    let modelMatrix = m4.multiply(translationMatrix, m4.multiply(rotationMatrix, viewMatrix));

    // Light model transformations
    let lightModelMatrix = m4.translation(lightLocation[0], lightLocation[1], lightLocation[2]);
    lightModelMatrix = m4.multiply(viewMatrix, lightModelMatrix);
    lightModelMatrix = m4.multiply(rotationMatrix, lightModelMatrix);
    lightModelMatrix = m4.multiply(translationMatrix, lightModelMatrix);

    // Draw the model and light
    shaderProgram.Use();
    gl.uniformMatrix4fv(shaderProgram.iModelMatrix, false, modelMatrix);
    gl.uniformMatrix4fv(shaderProgram.iProjectionMatrix, false, projectionMatrix);
    gl.uniform4fv(shaderProgram.iLightLocation, m4.transformVector(lightModelMatrix, [0.0, 0.0, 0.0, 1.0], []));        
    gl.uniform3fv(shaderProgram.iColor, [0.0, 0.0, 1.0]);
    modelSurface.Draw();

    lightShaderProgram.Use();
    gl.uniformMatrix4fv(lightShaderProgram.iModelMatrix, false, lightModelMatrix);
    gl.uniformMatrix4fv(lightShaderProgram.iProjectionMatrix, false, projectionMatrix);
    lightModelSurface.Draw();
}

// Initialize WebGL and set up the scene
function init() {
    let prog = create(gl, vertexShaderSource, fragmentShaderSource);
    let progLight = create(gl, vertexLightShaderSource, fragmentLightShaderSource);

    // Create shader programs
    shaderProgram = new ShaderProgram('Basic', prog);
    lightShaderProgram = new ShaderProgram('Light', progLight);

    // Set attribute and uniform locations for shader programs
    shaderProgram.iAttribVertex = gl.getAttribLocation(prog, "in_vertex");
    shaderProgram.iAttribNormal = gl.getAttribLocation(prog, "in_normal");
    shaderProgram.iModelMatrix = gl.getUniformLocation(prog, "model");
    shaderProgram.iProjectionMatrix = gl.getUniformLocation(prog, "projection");
    shaderProgram.iLightLocation = gl.getUniformLocation(prog, "light_location");
    shaderProgram.iColor = gl.getUniformLocation(prog, "color");

    lightShaderProgram.iAttribVertex = gl.getAttribLocation(progLight, "in_vertex");
    lightShaderProgram.iProjectionMatrix = gl.getUniformLocation(progLight, "projection");
    lightShaderProgram.iModelMatrix = gl.getUniformLocation(progLight, "model");

    // Create model and light surfaces
    modelSurface = new Model(gl, shaderProgram);
    modelSurface.CreateSurfaceData();
    lightModelSurface = new Light(gl, lightShaderProgram, lightPositionU, lightPositionV);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
}

// Function to create and compile shaders
function create(gl, vShaderSource, fShaderSource) {
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vertexShader));
    }

    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fragmentShader));
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(program));
    }
    return program;
}

// Update function to regenerate surface data and redraw
function update() {
    modelSurface.CreateSurfaceData();
    draw();
}

// Event listeners for zoom and light position controls
zoomInButton.addEventListener('click', () => {
    zoomLevel += zoomIncrement;
    draw();
});

zoomOutButton.addEventListener('click', () => {
    zoomLevel -= zoomIncrement;
    draw();
});

document.getElementById('lightU').addEventListener('input', (event) => {
    lightPositionU = parseFloat(event.target.value);
    draw();
});

document.getElementById('lightV').addEventListener('input', (event) => {
    lightPositionV = parseFloat(event.target.value);
    draw();
});

// Event listeners for surface data changes
document.getElementById('circleCount').addEventListener('change', update);
document.getElementById('segmentsCount').addEventListener('change', update);

// Initialize WebGL and set up the app
function initializeApp() {
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
        init();
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    // Initialize trackball rotator
    trackballRotator = new TrackballRotator(canvas, draw, 0);

    // Initial drawing
    draw();
}

// Wait for the DOM to load before initializing
document.addEventListener("DOMContentLoaded", initializeApp);
