//Simple lit transform for static models
attribute vec3 xyz;
attribute vec3 normal;
attribute vec2 uv;

void main ()
{
	gl_Position = _pmv*vec4 (xyz, 1.0);
	
	//Calculate lighting
	vec3 lightd = normalize (_light_pos - xyz);
	vec3 eyed = normalize (_eye - xyz);
	vec3 h = normalize (lightd + eyed);
	frag_directed = max (0.0, dot (lightd, normal));
	frag_reflected = dot (normal, h);
	
	//Calculate environment map coords
	frag_env_uv = vec2 (0.5, 0.5) + 0.5*eyed.xy;
	frag_uv = uv;
}