//Simple unlit transform for lines, points, et cetera
attribute vec4 xyz;

void main ()
{
	vec4 p = _pmv*xyz;
	gl_PointSize = 64.0/p.z;
	gl_Position = p;
}
