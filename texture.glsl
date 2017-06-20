//Lit and textured fragment shader
void main ()
{	//Start off with basal ambient light
	vec3 c = _ambient;
	//Add in the diffuse
	c += _diffuse*frag_directed;
	//Emit some light
	c += _emissive;
	//Factor in specular glow
	//Clamp to 0~1 since interpolation artefacts are very visible here
	float x = pow (max (0.0, min (1.0, frag_reflected)), _shininess);
	c += _specular*x;
	//Add in textures
	vec4 b = _stages.x*texture2D (_map1, frag_uv);
	vec4 e = _stages.y*texture2D (_map2, frag_uv);
	float k = e.a;
	float g = 1.0 - k;
	vec4 t = k*e + g*b;
	//Modulate in the light colour
	c *= _light_colour;
	//Store
	gl_FragColor = t*vec4 (c, _alpha)*_colour;
}
