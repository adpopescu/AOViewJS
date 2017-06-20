//Hardware skining shader
attribute vec3 xyz1;
attribute vec3 xyz2;
attribute vec2 uv;
attribute vec3 normal;
attribute vec2 bones;
attribute float bias;
uniform vec4 pose[MAX_BONES];

void main ()
{
	vec4 x, y, z;
	vec3 p, u;
	int id;
	
	//Matrix paletting
	float s = bias;
	float t = 1.0 - s;
	
	vec4 a = s*vec4 (xyz1, 1.0);
	vec3 n = s*normal;
	vec4 b = t*vec4 (xyz2, 1.0);
	vec3 m = t*normal;

	id = int (3.0*bones.x + 0.1);
	x = pose[id++];
	y = pose[id++];
	z = pose[id];
	p.x = dot (a, x);
	u.x = dot (n, x.xyz);
	p.y = dot (a, y);
	u.y = dot (n, y.xyz);
	p.z = dot (a, z);
	u.z = dot (n, z.xyz);
	
	id = int (3.0*bones.y + 0.1);
	x = pose[id++];
	y = pose[id++];
	z = pose[id];
	p.x += dot (b, x);
	u.x += dot (m, x.xyz);
	p.y += dot (b, y);
	u.y += dot (m, y.xyz);
	p.z += dot (b, z);
	u.z += dot (m, z.xyz);
	
	gl_Position = _pmv*vec4 (p, 1.0);
	u = normalize (u);
	
	//Calculate lighting
	vec3 lightd = normalize (_light_pos - p);
	vec3 eyed = normalize (_eye - p);
	vec3 h = normalize (lightd + eyed);
	frag_directed = max (0.0, dot (lightd, u));
	frag_reflected = dot (u, h);
	
	//Calculate environment map coords
	frag_env_uv = vec2 (0.5, 0.5) + 0.5*eyed.xy;
	frag_uv = uv;
}
