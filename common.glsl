//Common interface for our shaders
#version 100
//Use single precision
precision mediump float;
precision mediump int;
//Defines
#define MAX_BONES	96 /*3n, where n is the number of bones (=32 here)*/
//Matrices
uniform mat4 _pm;
uniform mat4 _mm;
uniform mat4 _pmv;
//Model properties
uniform vec4 _colour;
uniform vec3 _eye;
//Material system
uniform sampler2D _map1;
uniform sampler2D _map2;
uniform sampler2D _env_map;
uniform vec3 _ambient;
uniform vec3 _diffuse;
uniform vec3 _specular;
uniform vec3 _emissive;
uniform float _shininess;
uniform float _alpha;
uniform vec4 _stages;
//Lighting
uniform vec3 _light_pos;
uniform vec3 _light_colour;
//Vertex -> fragment stores
varying float frag_directed;
varying float frag_reflected;
varying vec2 frag_uv;
varying vec2 frag_env_uv;
