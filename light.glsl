// Vertex shader
const vertexLightShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec3 in_vertex; 

uniform mat4 projection;
uniform mat4 model;

void main() {
    gl_Position = projection * model * vec4(in_vertex, 1.0);
}`;


// Fragment shader
const fragmentLightShaderSource = `#version 300 es
precision mediump float;

out vec4 out_color;

void main() {
   out_color = vec4(1.0, 1.0, 1.0, 1.0);
}`;
