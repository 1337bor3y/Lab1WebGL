export default function Light(gl, shLightProgram,) {
    this.vBuffer = gl.createBuffer();
    
    let size = 0.06;
    let vertices = [
        // Front face
        -size, -size,  size,
         size, -size,  size,
         size,  size,  size, 
         size,  size,  size,
        -size,  size,  size,
        -size, -size,  size, 

        // Back face
        -size, -size, -size,
        -size,  size, -size,
         size,  size, -size,
         size,  size, -size, 
         size, -size, -size,
        -size, -size, -size,  

        // Left face
        -size,  size,  size, 
        -size,  size, -size,
        -size, -size, -size, 
        -size, -size, -size,  
        -size, -size,  size,  
        -size,  size,  size,  

        // Right face
        size,  size,  size,  
        size, -size, -size,  
        size,  size, -size, 
        size, -size, -size, 
        size,  size,  size,  
        size, -size,  size, 

        // Top face
        -size,  size, -size, 
         size,  size, -size, 
         size,  size,  size,  
         size,  size,  size,  
        -size,  size,  size,  
        -size,  size, -size,  

        // Bottom face
        -size, -size, -size,  
        -size, -size,  size, 
         size, -size,  size, 
         size, -size,  size,  
         size, -size, -size, 
        -size, -size, -size  
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
        gl.vertexAttribPointer(shLightProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shLightProgram.iAttribVertex);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
    this.getLocation = function(lightU, lightV) {
        let U = lightU / 180.0;
        let V = lightV / 180.0;
        const x = 2.0 * Math.sin( V * Math.PI) * Math.cos(U * 2.0 * Math.PI);
        const y = 2.0 * Math.cos( V * Math.PI);
        const z = 2.0 * Math.sin( V * Math.PI) * Math.sin(U * 2.0 * Math.PI);
        return [ x, y, z ];
    }
}
