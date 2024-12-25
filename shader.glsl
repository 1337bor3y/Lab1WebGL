// Vertex shader
const vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec3 in_vertex; 
layout(location = 1) in vec2 in_uv; 
layout(location = 2) in vec3 in_tangent; 
layout(location = 3) in vec3 in_bitangent; 

flat out vec3 fragment_color;

uniform mat4 projection;
uniform mat4 model;

uniform vec4 light_location;

uniform sampler2D diffuse_texture;
uniform sampler2D normal_texture;
uniform sampler2D specular_texture;

vec3 load_world_space_normal()
{
   vec3 tangent_space_normal = (texture(normal_texture, in_uv).rgb * vec3(2.0)) - vec3(1.0);
   vec3 normal = normalize(cross(in_tangent, in_bitangent));
   mat3 TBN = mat3(in_tangent, in_bitangent, normal);
   normal = normalize(TBN * tangent_space_normal);
   return normalize(mat3(transpose(inverse(model))) * normal);
}

void main() {
   vec3 color = texture(diffuse_texture, in_uv).rgb;
   vec3 normal = load_world_space_normal();
   vec4 vertex = model * vec4(in_vertex, 1.0);
   vertex /= vertex.w;

   vec3 view_dir = normalize(-vertex.xyz);

   if (dot(normal, view_dir) < 0.0) {
      normal = -normal;
   }

   vec3 light_direction = normalize(vertex.xyz - (light_location.xyz / light_location.w));

   vec3 ambient = vec3(0.1);
   vec3 diffuse = vec3(max(dot(normal, -light_direction), 0.0));

   vec3 reflect_dir = reflect(light_direction, normal);
   float specular_intensity = pow(texture(specular_texture, in_uv).r, 8.0) * 2.0;
   vec3 specular = vec3(specular_intensity) * pow(max(dot(view_dir, reflect_dir), 0.0), 2.0);

   fragment_color = (ambient + diffuse + specular) * color;
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
