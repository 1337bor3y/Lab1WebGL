let scene, camera, renderer;
let uLinesMesh, vLinesMesh;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Parameters for the sinusoid
const a = 2;   // Amplitude
const n = 3;   // Number of half-waves
const R = 15;   // Radius
const uSegments = 50; // Number of segments for 'r'
const vSegments = 50; // Number of segments for 'beta'

// Parametric equations for the surface
function parametricSurface(r, beta) {
    const z = a * Math.cos((n * Math.PI * r) / R);  // z coordinate (height)
    const x = r * Math.cos(beta);  // x coordinate
    const y = r * Math.sin(beta);  // y coordinate
    return new THREE.Vector3(x, y, z);
}

// Function to generate the surface wireframe as U and V polylines
function generateSurfaceWireframe() {
    const uLines = [];
    const vLines = [];

    // Generate U polylines (lines in radial direction)
    for (let i = 0; i <= uSegments; i++) {
        const r = (i / uSegments) * R;  // Radial distance
        const lineVertices = [];
        for (let j = 0; j <= vSegments; j++) {
            const beta = (j / vSegments) * 2 * Math.PI;  // Angle around z-axis
            const vertex = parametricSurface(r, beta);
            lineVertices.push(vertex);
        }
        uLines.push(lineVertices);
    }

    // Generate V polylines (lines in angular direction)
    for (let j = 0; j <= vSegments; j++) {
        const beta = (j / vSegments) * 2 * Math.PI;  // Angle around z-axis
        const lineVertices = [];
        for (let i = 0; i <= uSegments; i++) {
            const r = (i / uSegments) * R;  // Radial distance
            const vertex = parametricSurface(r, beta);
            lineVertices.push(vertex);
        }
        vLines.push(lineVertices);
    }

    return { uLines, vLines };
}

// Function to convert the lines to geometry
function createLineGeometry(lines) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    lines.forEach((line) => {
        line.forEach((vertex) => {
            vertices.push(vertex.x, vertex.y, vertex.z);
        });
    });

    // Connect the points with indices
    let offset = 0;
    lines.forEach((line) => {
        for (let i = 0; i < line.length - 1; i++) {
            indices.push(offset + i, offset + i + 1);
        }
        offset += line.length;
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    return geometry;
}

// Function to set up the scene
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Generate the surface wireframe and add it to the scene
    const { uLines, vLines } = generateSurfaceWireframe();

    // Create U and V line geometries
    const uLineGeometry = createLineGeometry(uLines);
    const vLineGeometry = createLineGeometry(vLines);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    // Create U and V line meshes
    uLinesMesh = new THREE.LineSegments(uLineGeometry, lineMaterial);
    vLinesMesh = new THREE.LineSegments(vLineGeometry, lineMaterial);

    scene.add(uLinesMesh);
    scene.add(vLinesMesh);

    // Add mouse events for rotation
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('mouseleave', onMouseUp, false);

    // Set up animation loop
    animate();
}

// Mouse events for dragging
function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseMove(event) {
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        // Rotate the surface based on mouse movement
        uLinesMesh.rotation.y += deltaX * 0.005;
        vLinesMesh.rotation.y += deltaX * 0.005;
        uLinesMesh.rotation.x += deltaY * 0.005;
        vLinesMesh.rotation.x += deltaY * 0.005;

        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
}

function onMouseUp() {
    isDragging = false;
}

// Function to animate the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Call the init function when the page loads
window.onload = init;
