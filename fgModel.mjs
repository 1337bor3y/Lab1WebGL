export default function Model(gl, shaderProgram) {
    this.gl = gl;
    this.vertexBuffer = gl.createBuffer();  // Buffer for storing vertex data
    this.vertexCount = 0;                   // Number of vertices to draw
    this.drawMode = gl.TRIANGLES;           // Drawing mode (TRIANGLES)

    // Method to load vertex data into the buffer
    this.BufferData = function(vertices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        this.vertexCount = vertices.length / 6;  // Number of vertices is length divided by 6 (x, y, z, normal)
    }

    // Method to bind buffers and draw the surface
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        
        // Bind and enable vertex position attribute
        gl.vertexAttribPointer(shaderProgram.iAttribVertex, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(shaderProgram.iAttribVertex);

        // Bind and enable vertex normal attribute
        gl.vertexAttribPointer(shaderProgram.iAttribNormal, 3, gl.FLOAT, false, 24, 12);
        gl.enableVertexAttribArray(shaderProgram.iAttribNormal);
        
        gl.drawArrays(this.drawMode, 0, this.vertexCount);  // Draw the triangles
    }

    // Method to generate a vertex based on angle, normal, and radius values
    this.CreateVertex = function(angle, normal, radiusStep, radius, beta) {
        const x = radius * Math.cos(beta),
              y = radius * Math.sin(beta),
              z = angle * Math.cos(normal * Math.PI * radius / radiusStep);
        return [x, y, z];  // Return vertex coordinates
    }

    // Method to generate points along a radius
    this.GenerateLinePoints = function(radiusStep, radius, pointConstructor) {
        let points = [];
        
        for (let r = 0; r <= radius; r += radiusStep) {
            points.push(pointConstructor(r));  // Add generated points
        }

        return points;
    }

    // Method to calculate normal vector of a triangle formed by three points
    this.CalculateNormal = function(pointA, pointB, pointC) {
        let vectorA = m4.normalize(m4.subtractVectors(pointB, pointA, []), []);  // Vector from A to B
        let vectorB = m4.normalize(m4.subtractVectors(pointC, pointA, []), []);  // Vector from A to C
        let normal = m4.cross(vectorA, vectorB, []);  // Cross product to get normal

        return normal;
    }

    // Method to create surface data based on the number of circles and segments
    this.CreateSurfaceData = function() {
        const angle = 0.1, normal = 1, radiusStep = 0.1;  // Constants for vertex calculation
        let vertices = [];  // List to hold vertex data
        let radius = 1;
        
        let radiusStepValue = radius / parseInt(document.getElementById('circleCount').value);
        let segmentStepValue = (2 * Math.PI) / parseInt(document.getElementById('segmentsCount').value);
                
        // Loop through segments and generate vertices for each
        for (let beta = segmentStepValue; beta <= 2 * Math.PI + 0.001; beta += segmentStepValue) {
            let firstLine = this.GenerateLinePoints(radiusStepValue, radius, (r) => {
                return this.CreateVertex(angle, normal, radiusStep, r, beta); 
            });
            let secondLine = this.GenerateLinePoints(radiusStepValue, radius, (r) => {
                return this.CreateVertex(angle, normal, radiusStep, r, beta - segmentStepValue); 
            });

            // Loop through the vertices and calculate normals for each triangle
            for(let i = 1; i < firstLine.length; ++i) {
                let firstNormal = this.CalculateNormal(firstLine[i - 1], secondLine[i], firstLine[i]);
                let secondNormal = this.CalculateNormal(firstLine[i - 1], secondLine[i], secondLine[i - 1]);

                // Add vertices with normals for each triangle
                vertices.push(...firstLine[i - 1], ...firstNormal);
                vertices.push(...secondLine[i], ...firstNormal);
                vertices.push(...firstLine[i], ...firstNormal);

                vertices.push(...firstLine[i - 1], ...secondNormal);
                vertices.push(...secondLine[i], ...secondNormal);
                vertices.push(...secondLine[i - 1], ...secondNormal);
            }
        }
        
        this.BufferData(vertices);  // Upload vertex data to buffer
    }
}
