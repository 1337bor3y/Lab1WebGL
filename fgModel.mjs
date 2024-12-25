import LoadTexture from "./TextureHandler.mjs"

// Model constructor function
export default function Model(gl, shProgram) {
    // WebGL context and shader program
    this.gl = gl;

    // Vertex buffer object for storing vertex data
    this.iVertexBuffer = gl.createBuffer();

    // Number of vertices
    this.count = 0;

    // Primitive drawing type (triangles in this case)
    this.type = gl.TRIANGLES;

    // Texture IDs for diffuse, normal, and specular maps
    this.idTextureDiffuse = 0;
    this.idTextureNormal = 0;
    this.idTextureSpecular = 0;

    // Function to upload vertex data to the GPU buffer
    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.count = vertices.length / 11; // Each vertex has 11 components
    }

    // Function to draw the model using the current buffer data
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);

        // Set vertex attributes for position, UVs, tangent, and bitangent
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 44, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.vertexAttribPointer(shProgram.iAttribUV, 2, gl.FLOAT, false, 44, 12);
        gl.enableVertexAttribArray(shProgram.iAttribUV);
        gl.vertexAttribPointer(shProgram.iAttribTangent, 3, gl.FLOAT, false, 44, 20);
        gl.enableVertexAttribArray(shProgram.iAttribTangent);
        gl.vertexAttribPointer(shProgram.iAttribBitangent, 3, gl.FLOAT, false, 44, 32);
        gl.enableVertexAttribArray(shProgram.iAttribBitangent);

        // Bind textures to corresponding texture units
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureDiffuse);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureNormal);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.idTextureSpecular);

        // Draw the object
        gl.drawArrays(this.type, 0, this.count);
    }

    // Function to create a vertex with spherical coordinates
    this.CreateVertex = function(a, n, R, r, b) {
        const x = r * Math.cos(b),
              y = r * Math.sin(b),
              z = a * Math.cos(n * Math.PI * r / R);
        // Return the vertex as an array with position and UV coordinates
        return [x, y, z, r, b / (2 * Math.PI)];
    }

    // Function to generate points along a line using the given step and constructor
    this.GenerateLinePoints = function(radiusStep, radius, pointConstructor) {
        let vertexList = [];
        for (let r = 0; r <= radius; r += radiusStep) {
            vertexList.push(pointConstructor(r)); // Create points using the constructor
        }
        return vertexList;
    }

    // Function to calculate the tangent and bitangent of a triangle given three vertices
    this.CalculateTangentAndBitangent = function(v0, v1, v2) {
        let edge1 = m4.subtractVectors(v1, v0, []);
        let edge2 = m4.subtractVectors(v2, v0, []);
        let normal = m4.normalize(m4.cross(edge1, edge2, []), [0.0, 1.0, 0.0]);

        // Calculate the tangent vector
        let tangent = m4.normalize(m4.subtractVectors(edge1, m4.scaleVector(normal, m4.dot(normal, edge1), []), []));
        // Calculate the bitangent vector
        let bitangent = m4.normalize(m4.cross(normal, tangent, []), []);

        // Return both the tangent and bitangent vectors
        return [...tangent, ...bitangent];
    }

    // Function to create surface data (vertex positions, normals, etc.)
    this.CreateSurfaceData = function() {
        const a = 0.1, n = 1, R = 0.1; // Parameters for vertex creation
        let vertexList = []; // List to hold the vertices

        let radius = 1;
        // Calculate step sizes for radius and segments
        let radiusStep = radius / parseInt(document.getElementById('circleCount').value);
        let segmentStep = (2 * Math.PI) / parseInt(document.getElementById('segmentsCount').value);

        // Loop over all segments to generate the surface
        for (let beta = segmentStep; beta <= 2 * Math.PI + 0.001; beta += segmentStep) {
            // Generate points for two lines (current and previous segment)
            let firstLine = this.GenerateLinePoints(radiusStep, radius, (r) => { return this.CreateVertex(a, n, R, r, beta); });
            let secondLine = this.GenerateLinePoints(radiusStep, radius, (r) => { return this.CreateVertex(a, n, R, r, beta - segmentStep); });

            // Create triangles by connecting the lines
            for(let index = 1; index < firstLine.length; ++index) {
                // Calculate tangent and bitangent for each vertex
                let firstNormal = this.CalculateTangentAndBitangent(firstLine[index - 1], secondLine[index], firstLine[index]);
                let secondNormal = this.CalculateTangentAndBitangent(firstLine[index - 1], secondLine[index], secondLine[index - 1]);

                // Push the vertex data (positions, normals) into the vertex list
                vertexList.push(...firstLine[index - 1], ...firstNormal);
                vertexList.push(...secondLine[index], ...firstNormal);
                vertexList.push(...firstLine[index], ...firstNormal);

                vertexList.push(...firstLine[index - 1], ...secondNormal);
                vertexList.push(...secondLine[index], ...secondNormal);
                vertexList.push(...secondLine[index - 1], ...secondNormal);
            }
        }

        // Upload the vertex data to the GPU buffer
        this.BufferData(vertexList);

        // Load textures for diffuse, normal, and specular maps
        this.idTextureDiffuse = LoadTexture(gl, "./textures/diffuse.jpg");
        this.idTextureNormal = LoadTexture(gl, "./textures/normal.jpg");
        this.idTextureSpecular = LoadTexture(gl, "./textures/specular.jpg");
    }
}
