function m4x4_identity (m)
{
	m[ 0] = 1; m[ 1] = 0; m[ 2] = 0; m[ 3] = 0;
	m[ 4] = 0; m[ 5] = 1; m[ 6] = 0; m[ 7] = 0;
	m[ 8] = 0; m[ 9] = 0; m[10] = 1; m[11] = 0;
	m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
}
function m4x4_from_perspective (m, fov, aspect, near, far)
{
	let d = near - far;
	let y = 1.0/Math.tan (Math.PI*fov/360.0);
	let x = y/aspect;
	let z = (far + near)/d;
	let w = far*near/d;
	m[ 0] = x; m[ 1] = 0; m[ 2] = 0; m[ 3] = 0;
	m[ 4] = 0; m[ 5] = y; m[ 6] = 0; m[ 7] = 0;
	m[ 8] = 0; m[ 9] = 0; m[10] = z; m[11] =-1;
	m[12] = 0; m[13] = 0; m[14] = w; m[15] = 0;
}
function m4x4_lookat (m, origin, point)
{	/*Clear out matrix*/
	m4x4_identity (m);
	/*Compute direction to point from origin*/
	let dx = point[0] - origin[0];
	let dy = point[1] - origin[1];
	let dz = point[2] - origin[2];
	let len = Math.sqrt (dx*dx + dy*dy + dz*dz);
	if (!len)
	{
		return;
	}
	let r = 1.0/len;
	dx *= r;
	dy *= r;
	dz *= r;
	/*Rotate direction 90 degrees to produce a perpendicular vector*/
	let sx =-dz;
	let sy = 0;
	let sz = dx;
	let cos = sx*dx + sy*dy + sz*dz;
	sx -= cos*dx;
	sy -= cos*dy;
	sz -= cos*dz;
	len = 1.0/Math.sqrt (sx*sx + sy*sy + sz*sz);
	sx *= len;
	sy *= len;
	sz *= len;
	/*Compute cross product to form another orthogonal vector*/
	let ux = sy*dz - sz*dy;
	let uy = sz*dx - sx*dz;
	let uz = sx*dy - sy*dx;
	/*Use the vectors to form a rotation matrix*/
	m[0] = sx; m[4] = sy; m[ 8] = sz;
	m[1] = ux; m[5] = uy; m[ 9] = uz;
	m[2] =-dx; m[6] =-dy; m[10] =-dz;
	/*Translate the offset*/
	m[12] =-m[0]*origin[0] -m[4]*origin[1] -m[ 8]*origin[2];
	m[13] =-m[1]*origin[0] -m[5]*origin[1] -m[ 9]*origin[2];
	m[14] =-m[2]*origin[0] -m[6]*origin[1] -m[10]*origin[2];
}
function m4x4_from_versor (m, q)
{
	let x2 = 2*q[0];
	let y2 = 2*q[1];
	let z2 = 2*q[2];
	let wx = q[3]*x2;
	let wy = q[3]*y2;
	let wz = q[3]*z2;
	let xy = q[0]*y2;
	let xz = q[0]*z2;
	let yz = q[1]*z2;
	let xx = q[0]*x2;
	let yy = q[1]*y2;
	let zz = q[2]*z2;
	m[ 0] = 1 - yy - zz;
	m[ 4] = xy - wz;
	m[ 8] = xz + wy;
	m[12] = 0;
	
	m[ 1] = xy + wz;
	m[ 5] = 1 - xx - zz;
	m[ 9] = yz - wx;
	m[13] = 0;
	
	m[ 2] = xz - wy;
	m[ 6] = yz + wx;
	m[10] = 1 - xx - yy;
	m[14] = 0;
	
	m[ 3] = 0;
	m[ 7] = 0;
	m[11] = 0;
	m[15] = 1;
}
function m4x4_multiply (a, b, c)
{
	for (let i = 0; i < 16; i += 4)
	{
		let x = i + 0;
		let y = i + 1;
		let z = i + 2;
		let w = i + 3;
		a[x] = b[x]*c[ 0] + b[y]*c[ 4] + b[z]*c[ 8] + b[w]*c[12];
		a[y] = b[x]*c[ 1] + b[y]*c[ 5] + b[z]*c[ 9] + b[w]*c[13];
		a[z] = b[x]*c[ 2] + b[y]*c[ 6] + b[z]*c[10] + b[w]*c[14];
		a[w] = b[x]*c[ 3] + b[y]*c[ 7] + b[z]*c[11] + b[w]*c[15];
	}
}
function m4x4_multiply_as_4x3 (a, b, c)
{
	for (let i = 0; i < 12; i += 4)
	{
		let x = i + 0;
		let y = i + 1;
		let z = i + 2;
		a[x] = b[x]*c[ 0] + b[y]*c[ 4] + b[z]*c[ 8];
		a[y] = b[x]*c[ 1] + b[y]*c[ 5] + b[z]*c[ 9];
		a[z] = b[x]*c[ 2] + b[y]*c[ 6] + b[z]*c[10];
	}
	a[12] = b[12]*c[ 0] + b[13]*c[ 4] + b[14]*c[ 8] + c[12];
	a[13] = b[12]*c[ 1] + b[13]*c[ 5] + b[14]*c[ 9] + c[13];
	a[14] = b[12]*c[ 2] + b[13]*c[ 6] + b[14]*c[10] + c[14];
}
function m4x4_multiply_as_3x3 (a, b, c)
{
	for (let i = 0; i < 12; i += 4)
	{
		let x = i + 0;
		let y = i + 1;
		let z = i + 2;
		a[x] = b[x]*c[ 0] + b[y]*c[ 4] + b[z]*c[ 8];
		a[y] = b[x]*c[ 1] + b[y]*c[ 5] + b[z]*c[ 9];
		a[z] = b[x]*c[ 2] + b[y]*c[ 6] + b[z]*c[10];
	}
}
function m4x4_translate (m, x, y, z)
{
	m[12] = x;
	m[13] = y;
	m[14] = z;
}

function versor_multiply (q, a, b)
{
	q[0] = a[3]*b[0] + a[0]*b[3] + a[1]*b[2] - a[2]*b[1];
	q[1] = a[3]*b[1] + a[1]*b[3] + a[2]*b[0] - a[0]*b[2];
	q[2] = a[3]*b[2] + a[2]*b[3] + a[0]*b[1] - a[1]*b[0];
	q[3] = a[3]*b[3] - a[0]*b[0] - a[1]*b[1] - a[2]*b[2];
}
function versor_rotatex (q, angle)
{
	let th = Math.PI*angle/360;
	q[0] = Math.sin (th);
	q[1] = 0;
	q[2] = 0;
	q[3] = Math.cos (th);
}
function versor_rotatey (q, angle)
{
	let th = Math.PI*angle/360;
	q[0] = 0;
	q[1] = Math.sin (th);
	q[2] = 0;
	q[3] = Math.cos (th);
}
function versor_slerp (q, a, t, b)
{
	let w = new Float32Array (4);
	let angle, u, v;
	/*Trivial rejections: t=0 results in a; t=1 results in b*/
	if (t <= 0)
	{
		q[0] = a[0];
		q[1] = a[1];
		q[2] = a[2];
		q[3] = a[3];
		return;
	}
	if (t >= 1)
	{
		q[0] = b[0];
		q[1] = b[1];
		q[2] = b[2];
		q[3] = b[3];
		return;
	}
	/*Address the issue of quaternion noncommutativity*/
	angle = a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
	if (angle < 0)
	{
		angle = -angle;
		w[0] = -b[0];
		w[1] = -b[1];
		w[2] = -b[2];
		w[3] = -b[3];
	}
	else
	{
		w[0] = b[0];
		w[1] = b[1];
		w[2] = b[2];
		w[3] = b[3];
	}
	/*Calculate interpolants. Linear interpolants are used when the angle is
	too small in order to avoid a divide by zero error*/
	if ((1 - angle) > 1e-5)
	{
		let th = Math.acos (angle);
		let s = 1/Math.sin (th);
		u = s*Math.sin (th*(1 - t));
		v = s*Math.sin (th*t);
	}
	else
	{
		u = 1 - t;
		v = t;
	}
	q[0] = u*a[0] + v*w[0];
	q[1] = u*a[1] + v*w[1];
	q[2] = u*a[2] + v*w[2];
	q[3] = u*a[3] + v*w[3];
}

function vec3_lerp (v, a, t, b)
{	/*Trivial rejections: t=0 results in a; t=1 results in b*/
	if (t <= 0)
	{
		v[0] = a[0];
		v[1] = a[1];
		v[2] = a[2];
		return;
	}
	if (t >= 1)
	{
		v[0] = b[0];
		v[1] = b[1];
		v[2] = b[2];
		return;
	}
	v[0] = a[0] + t*(b[0] - a[0]);
	v[1] = a[1] + t*(b[1] - a[1]);
	v[2] = a[2] + t*(b[2] - a[2]);
}
