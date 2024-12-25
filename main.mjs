'use strict';
import Light from "./fglight.mjs";               // Import Light class
import Model from "./fgmodel.mjs";               // Import Model class
import TrackballRotator from "./Utils/trackball-rotator.mjs"; // Import TrackballRotator for camera control

let gl;                         // The WebGL context.
let surface;                    // A surface model (3D object).
let lightSurface;               // A light source model.
let shProgram;                  // The shader program for rendering the surface.
let shLightProgram;             // The shader program for rendering the light source.
let spaceball;                  // Trackball rotator for camera control.

let zoomFactor = -10;           // Initial zoom factor.
const zoomStep = 1;             // The step value for zooming in/out.
const zoomIn = document.getElementById('zoomIn'); // Zoom-in button.
const zoomOut = document.getElementById('zoomOut'); // Zoom-out button.
let lightU = document.getElementById('lightU').value; // Initial light U-coordinate.
let lightV = document.getElementById('lightV').value; // Initial light V-coordinate.  

// Constructor for ShaderProgram to manage shaders.
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    // Attributes and uniforms locations
    this.iAttribVertex = -1;
    this.iProjectionMatrix = -1;
    this.iModelMatrix = -1;
    
    // Use the shader program for rendering.
    this.Use = function() {
        gl.useProgram(this.prog);
    };
}

/* Draws the 3D scene */
function draw() {
    gl.clearColor(0, 0, 0, 1);                // Set background color to black
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffers.

    let lightLocation = lightSurface.getLocation(lightU, lightV); // Get the light source position.

    // Set up projection matrix for 3D perspective view.
    let projection = m4.perspective(Math.PI / 8, 1, 0.1, 100); 
    let trackballView = spaceball.getViewMatrix(); // Get the current camera view matrix.
    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7); // Rotation matrix.
    let translateToPointZero = m4.translation(0, 0, zoomFactor); // Translation matrix for zoom effect.

    // Combine model transformation matrices (rotation and translation).
    let modelMatrix = m4.multiply(translateToPointZero, m4.multiply(rotateToPointZero, trackballView));
    
    // Calculate light's model matrix.
    let lightModel = m4.translation(lightLocation[0], lightLocation[1], lightLocation[2]);
    lightModel = m4.multiply(trackballView, lightModel);
    lightModel = m4.multiply(rotateToPointZero, lightModel);
    lightModel = m4.multiply(translateToPointZero, lightModel);

    // Set up shader program and pass in uniforms.
    shProgram.Use();
    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, modelMatrix);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
    gl.uniform4fv(shProgram.iLightLocation, m4.transformVector(lightModel, [0.0, 0.0, 0.0, 1.0], []));        
    gl.uniform1i(shProgram.iDiffuseTexture, 0);
    gl.uniform1i(shProgram.iNormalTexture, 1);
    gl.uniform1i(shProgram.iSpecularTexture, 2);
    
    // Draw the surface model.
    surface.Draw();

    // Set up the light shader program.
    shLightProgram.Use();
    gl.uniformMatrix4fv(shLightProgram.iModelMatrix, false, lightModel);
    gl.uniformMatrix4fv(shLightProgram.iProjectionMatrix, false, projection);

    // Draw the light source model.
    lightSurface.Draw();
}

/* Initializes the WebGL context and shaders */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource); // Compile the shaders.
    let progLight = createProgram(gl, vertexLightShaderSource, fragmentLightShaderSource);

    // Create shader programs for basic and light shaders.
    shProgram = new ShaderProgram('Basic', prog);
    shLightProgram = new ShaderProgram('Light', progLight);

    // Retrieve attribute and uniform locations for the basic shader.
    shProgram.iAttribVertex = gl.getAttribLocation(prog, "in_vertex");
    shProgram.iAttribUV = 1;
    shProgram.iAttribTangent = 2;
    shProgram.iAttribBitangent = 3;
    shProgram.iModelMatrix = gl.getUniformLocation(prog, "model");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "projection");
    shProgram.iLightLocation = gl.getUniformLocation(prog, "light_location");
    
    shProgram.iDiffuseTexture = gl.getUniformLocation(prog, "diffuse_texture");
    shProgram.iNormalTexture = gl.getUniformLocation(prog, "normal_texture");
    shProgram.iSpecularTexture = gl.getUniformLocation(prog, "specular_texture");

    // Retrieve attribute and uniform locations for the light shader.
    shLightProgram.iAttribVertex = gl.getAttribLocation(progLight, "in_vertex");
    shLightProgram.iProjectionMatrix = gl.getUniformLocation(progLight, "projection");
    shLightProgram.iModelMatrix = gl.getUniformLocation(progLight, "model");

    // Create the surface and light surface models.
    surface = new Model(gl, shProgram);
    surface.CreateSurfaceData();
    lightSurface = new Light(gl, shLightProgram, lightU, lightV);

    // Enable depth testing for proper 3D rendering.
    gl.enable(gl.DEPTH_TEST);
}

/* Helper function to create a shader program from vertex and fragment shaders */
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

    // Create the program and link the shaders.
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

/* Updates surface data and redraws */
function update(){
    surface.CreateSurfaceData();
    draw();
}

// Event listeners for zoom in/out buttons and light controls
zoomIn.addEventListener('click', () => {
    zoomFactor += zoomStep;
    draw();
});

zoomOut.addEventListener('click', () => {
    zoomFactor -= zoomStep;
    draw();
});

document.getElementById('lightU').addEventListener('input', (event) => {
    lightU = parseFloat(event.target.value); // Update light U-coordinate.
    draw();
});

document.getElementById('lightV').addEventListener('input', (event) => {
    lightV = parseFloat(event.target.value); // Update light V-coordinate.
    draw();
});

document.getElementById('circleCount').addEventListener('change', update); // Update surface data on change.
document.getElementById('segmentsCount').addEventListener('change', update); // Update surface data on change.
document.addEventListener('draw', draw); // Trigger redraw event.

/* Initialize the app */
function init() {
    let canvas;
    try {
        // Get the WebGL context from the canvas element.
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl2");
        if (!gl) {
            throw "Browser does not support WebGL"; // Handle WebGL context error.
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL(); // Initialize WebGL shaders and objects.
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    // Initialize TrackballRotator for camera control.
    spaceball = new TrackballRotator(canvas, draw, 0);

    draw(); // Initial draw call to render the scene.
}

document.addEventListener("DOMContentLoaded", init); // Initialize the app after the DOM is loaded.
