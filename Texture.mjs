import LoadTexture from "./TextureHandler.mjs";

// Vertex shader for texture rendering
const textureVertexShader = `precision mediump float;
attribute vec2 vertexPosition; // Attribute for vertex position
varying vec2 uvCoordinates; // Varying for passing UV coordinates

void main() {
    gl_Position = vec4(vertexPosition, 0.0, 1.0); // Position the vertex
    uvCoordinates = vertexPosition * 0.5 + 0.5; // Normalize UV coordinates
}
`;

// Fragment shader for texture rendering
const textureFragmentShader = `precision mediump float;
    varying vec2 uvCoordinates; // UV coordinates from the vertex shader
    uniform sampler2D diffuseTexture; // Diffuse texture to be applied
    void main() {
        gl_FragColor = texture2D(diffuseTexture, uvCoordinates); // Apply the texture
    }
`;

// Vertex shader for UV visualization
const uvVertexShader = `
    attribute vec2 vertexPosition; // Position of vertex

    uniform vec2 centerPoint; // Point around which the mesh will be rotated
    uniform float rotationAngle; // Angle for rotation

    void main() {
        vec2 translatedVertex = vertexPosition - centerPoint; // Translate vertex to origin
        
        float cosTheta = cos(rotationAngle); // Cosine of the angle
        float sinTheta = sin(rotationAngle); // Sine of the angle

        // Rotate the vertex by the given angle
        vec2 rotatedVertex = vec2(
            translatedVertex.x * cosTheta - translatedVertex.y * sinTheta,
            translatedVertex.x * sinTheta + translatedVertex.y * cosTheta
        );

        vec2 finalVertex = rotatedVertex + centerPoint; // Translate back to original position
        gl_Position = vec4(finalVertex * 2.0 - 1.0, 0.0, 1.0); // Final position for rendering
    }
`;

// Fragment shader for UV visualization (green color with low opacity)
const uvFragmentShader = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0, 1, 0, 0.2); // Set the fragment color to green with transparency
    }
`;

// Vertex shader for point rendering
const pointVertexShader = `
    uniform vec2 vertexPosition; // Position of the vertex
    void main() {
        gl_Position = vec4(vertexPosition * 2.0 - 1.0, 0.0, 1.0); // Position for point rendering
        gl_PointSize = 10.0; // Set point size
    }
`;

// Fragment shader for point rendering (yellow color)
const pointFragmentShader = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1, 1, 0, 1); // Set the fragment color to yellow
    }
`;

// Function to create and compile a shader from source code
function createShader(gl, shaderType, shaderSource) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    // Check for shader compilation errors
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Function to create a shader program from vertex and fragment shaders
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Check for program link errors
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// Function to convert triangle indices to line indices
function convertTrianglesToLines(triangleIndices) {
    const lineIndices = [];
    for (let i = 0; i < triangleIndices.length; i += 3) {
        const idx0 = triangleIndices[i];
        const idx1 = triangleIndices[i + 1];
        const idx2 = triangleIndices[i + 2];

        lineIndices.push(idx0, idx1);
        lineIndices.push(idx1, idx2);
        lineIndices.push(idx2, idx0);
    }
    return lineIndices;
}

// Main function to handle texture coordinate drawing
export default function TexCoordDrawer(mesh) {
    const surface = document.getElementById('uvcanvas');
    const gl = surface.getContext('webgl2');

    const diffuseTextureId = LoadTexture(gl, "./textures/diffuse.jpg");

    const textureVertexBuffer = gl.createBuffer();
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();

    const textureProgram = createProgram(gl, textureVertexShader, textureFragmentShader);
    const uvProgram = createProgram(gl, uvVertexShader, uvFragmentShader);
    const pointProgram = createProgram(gl, pointVertexShader, pointFragmentShader);

    let centerPoint = [0.5, 0.5]; // Default point for rotation
    let indexCount = 0; // Number of indices for drawing

    // Function to calculate mouse position on canvas
    function calculateMousePosition(event) {
        const rect = surface.getBoundingClientRect();
        const x = (event.clientX - rect.left) / surface.width;
        const y = 1.0 - ((event.clientY - rect.top) / surface.height);
        return [x, y];
    }

    // Mouse move event listener to show current coordinates
    surface.addEventListener('mousemove', (event) => {
        const [x, y] = calculateMousePosition(event);
        document.getElementById('coordinates').textContent = `Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)})`;
    });

    // Mouse down event listener to update center point and trigger draw
    surface.addEventListener('mousedown', (event) => {
        if (event.button == 0) { // Left mouse button
            centerPoint = calculateMousePosition(event);
            mesh.point = centerPoint;
            document.dispatchEvent(new Event('draw'));
        }
    });

    // Initialization function for WebGL setup
    this.init = function () {
        gl.clearColor(0, 0, 0, 1); // Set background color
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Set blend function

        gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);

        this.update();
    };

    // Update function to bind buffers and set data
    this.update = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.uvBuffer), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        const indices = convertTrianglesToLines(mesh.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

        indexCount = indices.length;
    };

    // Draw function to render the scene
    this.draw = function () {
        const angle = parseFloat(document.getElementById('Angle').value) * (Math.PI / 180.0);

        gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas

        // Draw texture
        gl.useProgram(textureProgram);
        let attribute = gl.getAttribLocation(textureProgram, 'vertexPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, textureVertexBuffer);
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Draw UV coordinates
        gl.useProgram(uvProgram);
        attribute = gl.getAttribLocation(uvProgram, 'vertexPosition');
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

        attribute = gl.getUniformLocation(uvProgram, 'centerPoint');
        gl.uniform2fv(attribute, centerPoint);
        attribute = gl.getUniformLocation(uvProgram, 'rotationAngle');
        gl.uniform1f(attribute, angle);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseTextureId);
        gl.drawElements(gl.LINES, indexCount, gl.UNSIGNED_INT, 0);

        // Draw center point
        gl.useProgram(pointProgram);
        attribute = gl.getUniformLocation(pointProgram, 'vertexPosition');
        gl.uniform2fv(attribute, centerPoint);
        gl.drawArrays(gl.POINTS, 0, 1);
    };
}
