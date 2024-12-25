// Vertex shader
const vertexShaderSource = `#version 300 es
precision mediump float;

layout(location = 0) in vec3 in_vertex; 
layout(location = 1) in vec3 in_normal; 
layout(location = 2) in vec3 in_tangent;
layout(location = 3) in vec2 in_uv;  

flat out vec3 fragment_color;

uniform mat4 projection;
uniform mat4 model;

uniform vec4 light_location;

uniform sampler2D diffuse_texture;
uniform sampler2D normal_texture;
uniform sampler2D specular_texture;

uniform vec2 point;
uniform float angle;

vec2 rotate_uv() {
    vec2 uv = in_uv - point;
    float cosTheta = cos(angle);
    float sinTheta = sin(angle);

    uv = vec2(
        uv.x * cosTheta - uv.y * sinTheta,
        uv.x * sinTheta + uv.y * cosTheta
    );

    return uv + point;
}

vec3 load_world_space_normal(vec2 uv)
{
   vec3 normal = in_normal;
   vec3 tangent = in_tangent;

   normal = normalize(normal - dot(tangent, normal) * tangent);
   vec3 bitangent = cross(tangent, normal);

   mat3 TBN = mat3(tangent, bitangent, normal);
   vec3 tangent_space_normal = texture(normal_texture, uv).rgb;
   tangent_space_normal = 2.0 * tangent_space_normal - vec3(1.0, 1.0, 1.0);
   return normalize(mat3(transpose(inverse(model))) * normalize(TBN * tangent_space_normal));
}

void main() {
   vec2 uv = rotate_uv();
   vec3 color = texture(diffuse_texture, uv).rgb;
   vec3 normal = load_world_space_normal(uv);
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
   float specular_intensity = pow(texture(specular_texture, uv).r, 2.0);
   vec3 specular = vec3(specular_intensity) * pow(max(dot(view_dir, reflect_dir), 0.0), 8.0);

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
