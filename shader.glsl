// Vertex shader
const vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec3 in_vertex; 
layout(location = 1) in vec3 in_normal; 

flat out vec3 fragment_color;

uniform mat4 projection;
uniform mat4 model;

uniform vec3 color;
uniform vec4 light_location;

void main() {
   vec3 normal = normalize(mat3(transpose(inverse(model))) * in_normal);
   vec4 vertex = model * vec4(in_vertex, 1.0);
   vertex /= vertex.w;

   vec3 view_dir = normalize(-vertex.xyz);

   if (dot(normal, view_dir) < 0.0) {
      normal = -normal;
   }

   vec3 light_direction = normalize(vertex.xyz - (light_location.xyz / light_location.w));

   float lighting = max(dot(normal, -light_direction), 0.0);

   vec3 ambient = color * 0.1;
   vec3 diffuse = color * 0.9 * lighting;

   vec3 reflect_dir = reflect(light_direction, normal);
   float spec = pow(max(dot(view_dir, reflect_dir), 0.0), 32.0);
   vec3 specular = vec3(0.5) * spec;

   fragment_color = ambient + diffuse + specular;
   gl_Position = projection * vertex;
}`;


// Fragment shader
const fragmentShaderSource = `#version 300 es
precision mediump float;

out vec4 out_color;
flat in vec3 fragment_color;

void main() {
   out_color = vec4(fragment_color, 1.0);
}`;
