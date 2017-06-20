var M_PAN = 1;
var M_LIGHT = 2;
var M_DOLLY = 3;

var _ox, _oy;
var _mx, _my;
var _mode;
var _held;

var _pm, _mm, _pmv;
var _cam_angles;
var _cam_pos;
var _cam_velo;
var _light_angles;
var _anim;
var _lines;
var _mdl;
var _body = {};
var _head;

var _doskel = false;
var _dolight = false;
var _doskin = true;
var _dopause = false;
var _doequip = true;

var _velo;

var _pr_simple;
var _pr_static;
var _pr_skin;

var _static, _skin;
var _colour;

var _time;
var _anim_time = 0;

var _equip, _equip2;
var _equip_latched = null;
var _weap1 = null;
var _weap2 = null;

var _breed, _breed_latched;

var _anims = null;
var _head_req = null;
var _mdl_req = null;

var _breed_skin = null;
var _build;
var _scale;

var _inhibit = false;

var t1 = new Float32Array (16);
var t2 = new Float32Array (16);
var t3 = new Float32Array (16);
var t4 = new Float32Array (16);

var _pose = [];
var _vecs = [];

function load_init (msg)
{
	wgl_2d.fillStyle = "#262626";
	wgl_2d.fillRect (0, 0, wgl_canvas.width, wgl_canvas.height);
	wgl_2d.strokeStyle = "orange";
	wgl_2d.strokeRect (
		wgl_canvas.width/2 - 180,
		wgl_canvas.height/2 - 16,
		360, 
		32
	);
	wgl_2d.fillStyle = "orange";
	wgl_2d.font = "bold 64px sans-serif";
	wgl_2d.textAlign = "center";
	wgl_2d.fillText ("待", wgl_canvas.width/2, wgl_canvas.height/2 - 32);
	wgl_2d.font = "0.7em sans-serif";
	wgl_2d.fillText (msg, wgl_canvas.width/2, wgl_canvas.height/2 + 32);
}
function load_progress (perc)
{
	wgl_2d.fillStyle = "orange";
	wgl_2d.fillRect (
		wgl_canvas.width/2 - 177,
		wgl_canvas.height/2 - 13,
		perc*354, 
		26
	);
}


async function change_anim (anim)
{
	function load (binary)
	{
		_anim = load_cir2anim (binary);
		_anims[anim] = _anim;
		_anim_time = 0;
	}
	if (!_anims)
	{
		return;
	}
	if (_anims[anim])
	{/*Animation is already cached*/
		_anim = _anims[anim];
		_anim_time = 0;
		return;
	}
	/*Animation has to be downloaded*/
	let anims = _sex_anims[_breed.sex];
	return webgl_get (
		"data/" + _breed.sex + "/" + anims[anim] + ".cir2anim",
		true,
		load
	);
}
function equip_change ()
{
	if (_equip_latched == null)
	{
		return;
	}
	let equip = {};
	function apply ()
	{
		Object.keys(equip).forEach (k => {
			_equip[k] = equip[k];
		});
	}
	Object.keys(_breed.skin).forEach (k => {
		function update (tex)
		{
			equip[k] = tex;
		}
		webgl_image (_equip_latched[k], update);
	});
	_equip_latched = null;
	return webgl_pending_images (apply);
}
async function change_head (num)
{
	async function load (binary)
	{
		let abo = load_abo (binary);
		function apply ()
		{
			for (let i = 0; i < abo.materials.length; i++)
			{/*Materials seem to be wrong on the heads?*/
				abo.materials[i] = _mdl.materials["body"];
			}
			if (_head)
			{
				_head.skin.forEach (handle => {
					gl.deleteTexture (handle);
				});
				_head.meshes.forEach (mesh => {
					gl.deleteBuffer (mesh.verts);
					gl.deleteBuffer (mesh.indices);
				});
			}
			_head = abo;
			_head_req = null;
		}
		await webgl_pending_images (apply);
	}
	if (num < 0) num = 0;
	else if (_breed.heads <= num) num = _breed.heads - 1;
	/*Wait for any active request to finish before loading another model*/
	await _head_req;
	_head_req = webgl_get (
		"data/" + _breed.sex + "/" + _breed.breed + "/" + num + ".abo",
		true,
		load
	);	
	/*Body skin is set here, because solitus heads have different skin tones,
	and it would be stupid to have this a separate routine anyway*/
	let skin = _breed.skin;
	if (_breed.breed == "solitus")
	{
		if ("female" == _breed.sex)
		{
			if (24 == num) skin = _breed.skin2; /*asian*/
			else if (25 <= num && num < 32) skin = _breed.skin1; /*afro*/
			else if (32 <= num && num < 35) skin = _breed.skin2; /*asian*/
			else if (35 == num) skin = _breed.skin1; /*afro*/
			else if (36 <= num && num < 39) skin = _breed.skin2; /*asian*/
		}
		else
		{
			if (20 <= num && num < 23) skin = _breed.skin2; /*asian*/
			else if (23 <= num && num < 31) skin = _breed.skin1; /*afro*/
			else if (31 <= num && num < 37) skin = _breed.skin2; /*asian*/
			else if (41 == num) skin = _breed.skin1; /*afro*/
		}
	}
	/*See if the skin needs to be reloaded*/
	let body = {};
	function apply ()
	{
		if (_body)
		{
			Object.keys (_body).forEach (handle => {
				gl.deleteTexture (_body[handle]);
			});
		}
		_body = body;
	}
	if (_breed_skin != skin)
	{
		let base = "data/" + _breed.sex + "/" + _breed.breed + "/";
		Object.keys (skin).forEach (k => {
			body[k] = webgl_image (base + skin[k]);
		});
		await webgl_pending_images (apply);
	}
	_breed_skin = skin;
	_breed.lasthead = num;
	return _head_req;
}
async function change_model (model)
{
	function load (binary)
	{
		if (_mdl)
		{
			_mdl.meshes.forEach (mesh => {
				gl.deleteBuffer (mesh.verts);
				gl.deleteBuffer (mesh.indices);
			});
		}
		_mdl = load_cir2 (binary);
		_mdl_req = null;
	}
	/*Wait for any active request to finish before loading another model*/
	await _mdl_req;
	_mdl_req = webgl_get (
		"data/" + _breed.sex + "/" + _breed.breed + "/" + model + ".cir2web",
		true,
		load
	);
	_build = model;
	return _mdl_req;
}
async function breed_change ()
{	/*Check to see if user changed their breed*/
	if (null == _breed_latched)
	{
		return;
	}
	_inhibit = true;
	load_init ("Loading assets...");
	/*Populate animation list*/
	let db = document.getElementById ("anims");
	if (_breed == null || _breed_latched.sex != _breed.sex)
	{
		_anims = {};
		let anims = _sex_anims[_breed_latched.sex];	
		
		db.length = 0;
		Object.keys (anims).forEach (k => {
			let opt = document.createElement ("option");
			opt.text = k;
			db.add (opt);
		});
	}
	db.selectedIndex = 0;
	/*Merge equipment lists*/
	_equip_latched = {};
	Object.keys (_breed_latched.skin).forEach (k => {
		let tex = _equip2[k];
		if (!tex)  tex = "data/" + _breed_latched.sex + "/"
		+ _breed_latched.breed + "/" + _breed_latched.clothes[k];
		_equip_latched[k] = tex;
	});
	load_progress (0.25);
	/*Download models*/
	_breed = _breed_latched;
	let mdl = change_model (_build);
	let head = change_head (_breed.lasthead);
	load_progress (0.5);
	/*Wait for the model and head to load*/
	await mdl;
	load_progress (0.62);
	await head;
	load_progress (0.74);
	await equip_change ();
	load_progress (0.86);
	/*There needs to be at least one animation before continuing*/
	await change_anim ("idle");
	load_progress (1);
	/*Alloc pose and row vector matrices*/
	_pose.length = _mdl.bones.length;
	for (let i = 0; i < _pose.length; i++)
	{
		_pose[i] = new Float32Array (16);
	}
	_vecs.length = 12*_pose.length;
	/*And everything is done*/
	_breed_latched = null;
	_inhibit = false;
}
function animate (mdl, anim, tick)
{
	function seek (keys, pos)
	{
		let from, to;
		let i = keys.index;
		let data = keys.data;
		if (data.length == 1)
		{
			return [0, data[0], data[0]];
		}
		for (;;)
		{
			let j = (i + 1)%data.length;
			if (data[i].time <= pos && pos <= data[j].time)
			{
				from = data[i];
				to = data[j];
				break;
			}
			i = j;
		}
		keys.index = i;
		let t = (pos - from.time)/(to.time - from.time);
		return [t, from, to];
	}
	let bones = anim.bones;
	let tmp = t1;
	let q = t2;
	let v = t3;
	if (!_dopause)
	{
		_anim_time += tick;
		_anim_time %= anim.length;
	}
	/*Add the root joint first*/
	let m = _pose[0];
	let rot = seek (bones[0].r, _anim_time);
	versor_slerp (q, rot[1].or, rot[0], rot[2].or);	
	let pos = seek (bones[0].p, _anim_time);
	vec3_lerp (v, pos[1].tr, pos[0], pos[2].tr);
	
	m4x4_from_versor (m, q);
	m4x4_translate (m, v[0], v[1] - _breed.ofs[_build], v[2]);
	/*Stupid D3D bandaide*/
	m[ 2] = -m[2];
	m[ 6] = -m[6];
	m[10] = -m[10];
	m[14] = -m[14];
	/*Interpolate between keys*/
	for (let i = 1; i < bones.length; i++)
	{
		let g = mdl.bones[mdl.bones[i].parent].scale;
		
		rot = seek (bones[i].r, _anim_time);
		versor_slerp (q, rot[1].or, rot[0], rot[2].or);	
		pos = seek (bones[i].p, _anim_time);
		vec3_lerp (v, pos[1].tr, pos[0], pos[2].tr);
		
		let p = _pose[mdl.bones[i].parent];
		m = _pose[i];
		m4x4_from_versor (tmp, q);
		m4x4_translate (tmp, v[0], v[1], v[2]);
		m4x4_multiply_as_3x3 (m, tmp, p);
		/*Squeeze skeleton into proper shape
		NB: We transform position separately because scale in the matrix
		results in vertices getting puffed out incorrectly!*/
		m[12] = g*(tmp[12]*p[0] + tmp[13]*p[4] + tmp[14]*p[ 8]) + p[12];
		m[13] = g*(tmp[12]*p[1] + tmp[13]*p[5] + tmp[14]*p[ 9]) + p[13];
		m[14] = g*(tmp[12]*p[2] + tmp[13]*p[6] + tmp[14]*p[10]) + p[14];
	}
	return _pose;
}
async function aoview_frame ()
{
	let pr = null;
	function useprogram (prog)
	{
		if (prog != pr)
		{
			gl.useProgram (prog._prog);
			pr = prog;
		}
	}
	function vertexattrib (attr, length, type, normalise, stride, offset)
	{
		gl.vertexAttribPointer (
			pr.attribute[attr],
			length,
			type,
			normalise,
			stride,
			offset
		);	
	}
	function setup (prog, matrices)
	{
		if (matrices == undefined) matrices = true;
		useprogram (prog);
		if (matrices)
		{
			gl.uniformMatrix4fv (pr.uniform["_pm"], false, _pm);
			gl.uniformMatrix4fv (pr.uniform["_mm"], false, _mm);
			gl.uniformMatrix4fv (pr.uniform["_pmv"], false, _pmv);
		}
		gl.uniform4f (pr.uniform["_colour"], 1, 1, 1, 1);
		gl.uniform3f (pr.uniform["_light_colour"], 1.0, 0.9, 0.95);
		gl.uniform3fv (pr.uniform["_light_pos"], light);	
		gl.uniform3fv (pr.uniform["_eye"], _cam_pos);
		gl.uniform1i (pr.uniform["_map1"], 0);
		gl.uniform1i (pr.uniform["_map2"], 1);
	}
	function setup_material (mat, map1, map2)
	{	
		if (map1 == undefined) map1 = null;
		if (map2 == undefined) map2 = null;
		let stages = [
			(map1 != null) + 0,
			(map2 != null)*_doequip, 
			0, 
			0
		];
		/*Set material properties*/
		gl.uniform3fv (pr.uniform["_diffuse"], mat.diffuse);
		gl.uniform3fv (pr.uniform["_ambient"], mat.ambient);
		gl.uniform3fv (pr.uniform["_specular"], mat.specular);
		gl.uniform3fv (pr.uniform["_emissive"], mat.emissive);
		gl.uniform1f (pr.uniform["_shininess"], mat.shine);
		gl.uniform1f (pr.uniform["_alpha"], mat.alpha);
		gl.uniform4fv (pr.uniform["_stages"], stages);
		/*Setup texturing state*/
		if (stages[0]) webgl_bindtexture (0, map1);
		if (stages[1]) webgl_bindtexture (1, map2);
	}
	function draw_attachment (model, attractor)
	{	/*Set up matrices*/
		let att = _mdl.attractors[attractor];
		m4x4_from_versor (t1, att.or);
		m4x4_translate (t1, att.tr[0], att.tr[1], att.tr[2]);
		m4x4_multiply_as_4x3 (t2, t1, pose[att.id]);
	
		m4x4_multiply (t1, t2, _mm);
		m4x4_multiply (t3, t1, _pm);
		gl.uniformMatrix4fv (pr.uniform["_mm"], false, t1);
		gl.uniformMatrix4fv (pr.uniform["_pmv"], false, t3);
		
		/*Bring light into attachment space*/
		let lp = [
			(light[0]*t2[0] + light[1]*t2[4] + light[2]*t2[ 8] + t2[12]),
			(light[0]*t2[1] + light[1]*t2[5] + light[2]*t2[ 9] + t2[13]),
			(light[0]*t2[2] + light[1]*t2[6] + light[2]*t2[10] + t2[14])
		];
		gl.uniform3fv (pr.uniform["_light_pos"], lp);
		
		/*Draw the meshes*/
		model.meshes.forEach (mesh => {
			setup_material (
				model.materials[mesh.slot], 
				model.skin[mesh.slot],
				null
			);
			/*Setup buffers for drawing*/
			gl.bindBuffer (gl.ARRAY_BUFFER, mesh.verts);
			vertexattrib ("xyz", 3, gl.FLOAT, false, 32, 0);
			vertexattrib ("normal", 3, gl.FLOAT, true, 32, 12);
			vertexattrib ("uv", 2, gl.FLOAT, false, 32, 24);
			gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
			gl.drawElements (
				gl.TRIANGLES,
				mesh.nindices,
				gl.UNSIGNED_SHORT,
				0
			);
		});
	}
	function draw_model ()
	{	/*Set up the skinning shader and each mesh in the model*/
		setup (_skin);
		gl.uniform4fv (pr.uniform["pose"], vecs);
		gl.enableVertexAttribArray (pr.attribute["xyz1"]);
		gl.enableVertexAttribArray (pr.attribute["xyz2"]);
		gl.enableVertexAttribArray (pr.attribute["normal"]);
		gl.enableVertexAttribArray (pr.attribute["uv"]);
		gl.enableVertexAttribArray (pr.attribute["bones"]);
		gl.enableVertexAttribArray (pr.attribute["bias"]);
		_mdl.meshes.forEach (mesh => {
			setup_material (
				_mdl.materials[mesh.slot],
				_body[mesh.slot],
				_equip[mesh.slot]
			);
			gl.bindBuffer (gl.ARRAY_BUFFER, mesh.verts);
			vertexattrib ("xyz1", 3, gl.FLOAT, false, 40, 0);
			vertexattrib ("xyz2", 3, gl.FLOAT, false, 40, 12);
			vertexattrib ("uv", 2, gl.FLOAT, false, 40, 24);
			vertexattrib ("normal", 3, gl.BYTE, true, 40, 32);
			vertexattrib ("bias", 1, gl.UNSIGNED_BYTE, true, 40, 35);
			vertexattrib ("bones", 2, gl.UNSIGNED_BYTE, false, 40, 36);	
			gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
			gl.drawElements (
				gl.TRIANGLES,
				mesh.nindices,
				gl.UNSIGNED_SHORT,
				0
			);
		});
		gl.disableVertexAttribArray (pr.attribute["bias"]);
		gl.disableVertexAttribArray (pr.attribute["bones"]);
		gl.disableVertexAttribArray (pr.attribute["uv"]);
		gl.disableVertexAttribArray (pr.attribute["normal"]);
		gl.disableVertexAttribArray (pr.attribute["xyz2"]);
		gl.disableVertexAttribArray (pr.attribute["xyz1"]);
		/*Draw attachments*/
		setup (_static, false);
		gl.uniformMatrix4fv (pr.uniform["_pm"], false, _pm);
		gl.enableVertexAttribArray (pr.attribute["xyz"]);
		gl.enableVertexAttribArray (pr.attribute["normal"]);
		gl.enableVertexAttribArray (pr.attribute["uv"]);
		/*Heads have to have backfaces, since some expect them to be drawn*/
		gl.disable (gl.CULL_FACE);
		draw_attachment (_head, "Attractor01_head");
		gl.enable (gl.CULL_FACE);
		if (_weap1)
		{
			draw_attachment (_weap1, "Attractor02_righthand");
		}
		if (_weap2)
		{
			draw_attachment (_weap2, "Attractor03_lefthand");
		}
		gl.disableVertexAttribArray (pr.attribute["uv"]);
		gl.disableVertexAttribArray (pr.attribute["normal"]);
		gl.disableVertexAttribArray (pr.attribute["xyz"]);
	}
	/*Compute tick duration*/
	let time = performance.now ();
	let tick = time - _time;
	let dt = tick/1000.0;
	_time = time;
	/*Handle breed change*/
	await breed_change ();
	/*Handle equipment change*/
	equip_change ();
	/*Set up frame*/
	gl.clearColor (_colour[0], _colour[1], _colour[2], _colour[3]);
	gl.viewportWidth = wgl_canvas.width;
	gl.viewportHeight = wgl_canvas.height;
	gl.viewport (0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear (gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	webgl_clear2d ();
	/*Draw FPS*/
	let fps = 1000.0/tick;
	wgl_2d.fillStyle = "#999";
	wgl_2d.textAlign = "center";
	wgl_2d.font = "10px sans-serif";
	wgl_2d.fillText (
		"FPS: " + fps.toFixed (0),
		wgl_canvas.width/2,
		wgl_canvas.height - 4
	);
	/*Camera physics*/
	for (let i = 0; i < 2; i++)
	{
		_cam_angles[i] += dt*_velo[i];
		_velo[i] -= dt*10.0*_velo[i];
		if (Math.abs (_velo[i]) <= 1e-3)
		{
			_velo[i] = 0;
		}
	}
	for (let i = 0; i < 3; i++)
	{
		_cam_pos[i] += dt*_cam_velo[i];
		_cam_velo[i] -= dt*10.0*_cam_velo[i];
		if (Math.abs (_cam_velo[i]) <= 1e-3)
		{
			_cam_velo[i] = 0;
		}
	}
	/*Compute object transform*/
	let th = Math.PI*_cam_angles[0]/180.0;
	let c = Math.cos (th);
	let s = Math.sin (th);
	m4x4_identity (t1);
	t1[0] = c; t1[ 2] =-s;
	t1[8] = s; t1[10] = c;
	
	th = Math.PI*_cam_angles[1]/180.0;
	c = Math.cos (th);
	s = Math.sin (th);		
	m4x4_identity (t2);
	t2[5] = c; t2[ 6] = s;
	t2[9] =-s; t2[10] = c;
	m4x4_multiply (t3, t1, t2);
	/*FIXME: Make origin point model dependent? to focus on their faces?*/
	m4x4_identity (t1);
	m4x4_translate (t1, 0, -1.5, 0);
	m4x4_multiply (t4, t1, t3);
	/*Compute light transform*/
	versor_rotatey (t1, _light_angles[0]);
	versor_rotatex (t2, _light_angles[1]);
	versor_multiply (t3, t2, t1);
	m4x4_from_versor (t1, t3);
	let light = [t1[2]*4, t1[6]*4, t1[10]*4];
	/*Animate skeleton*/
	let pose = animate (_mdl, _anim, tick);
	let vecs = _vecs;
	if (_doskin)
	{	/*Create row 3x4 matrices from columns to conserve bandwidth*/
		let index = 0;
		for (let i = 0; i < pose.length; i++)
		{
			let m = pose[i];
			for (let j = 0; j < 3; j++)
				for (let k = 0; k < 4; k++)
					vecs[index++] = m[(k<<2) + j];
		}
		/*Draw scene from camera view*/
		_skin = _pr_skin;
		_static = _pr_static;
		m4x4_from_perspective (
			_pm,
			90,
			wgl_canvas.width/wgl_canvas.height,
			0.1,
			32
		);
		/*Scale model*/
		m4x4_identity (t2);
		t2[ 0] = _scale;
		t2[ 5] = _scale;
		t2[10] = _scale;
		m4x4_multiply (t3, t4, t2);
		/*Transform by camera*/
		m4x4_lookat (t1, [0, 0, 0], [0, 0,-1]);
		m4x4_translate (t1, -_cam_pos[0], -_cam_pos[1], -_cam_pos[2]);
		m4x4_multiply (_mm, t3, t1);
		m4x4_multiply (_pmv, _mm, _pm);
		draw_model ();
	}
	/*Draw skeleton*/
	if (_doskel)
	{
		let pts = [];
		for (let i = 1; i < _mdl.bones.length; i++)
		{
			let parent = pose[_mdl.bones[i].parent];
			pts.push (parent[12], parent[13], parent[14]);
			pts.push (pose[i][12], pose[i][13], pose[i][14]);
		}
		gl.bindBuffer (gl.ARRAY_BUFFER, _lines);
		gl.bufferData (
			gl.ARRAY_BUFFER,
			new Float32Array (pts),
			gl.DYNAMIC_DRAW
		);
		useprogram (_pr_simple);
		gl.uniformMatrix4fv (pr.uniform["_pmv"], false, _pmv);
		gl.uniform4f (pr.uniform["_colour"], 0, 1, 0, 1);
		gl.disable (gl.DEPTH_TEST);
		gl.enableVertexAttribArray (pr.attribute["xyz"]);
		vertexattrib ("xyz", 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays (gl.LINES, 0, pts.length/3);
		gl.disableVertexAttribArray (pr.attribute["xyz"]);
		gl.enable (gl.DEPTH_TEST);
	}
	if (_dolight)
	{	/*Dot*/
		useprogram (_pr_simple);
		gl.uniformMatrix4fv (pr.uniform["_pmv"], false, _pmv);
		gl.uniform4f (pr.uniform["_colour"], 1, 0.2, 0.2, 1);
		gl.bindBuffer (gl.ARRAY_BUFFER, _lines);
		gl.bufferData (
			gl.ARRAY_BUFFER,
			new Float32Array (light),
			gl.DYNAMIC_DRAW
		);
		gl.enableVertexAttribArray (pr.attribute["xyz"]);
		vertexattrib ("xyz", 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays (gl.POINTS, 0, 1);
		/*Stem*/
		gl.uniform4f (pr.uniform["_colour"], 1, 0.5, 0.5, 1);
		gl.bufferData (
			gl.ARRAY_BUFFER,
			new Float32Array ([
				0, 0, 0, light[0], light[1], light[2]
			]),
			gl.DYNAMIC_DRAW
		);
		gl.drawArrays (gl.LINES, 0, 2);
		gl.disableVertexAttribArray (pr.attribute["xyz"]);	
	}
	gl.finish ();
	window.requestAnimationFrame (aoview_frame);
}
function aoview_keydown (e)
{
	if (_inhibit)
	{
		return;
	}
	switch (e.key)
	{
	case "Shift":
		_mode = M_LIGHT;
		break;
	default:
		break;
	}
}
function aoview_keyup (e)
{
	if (_inhibit)
	{
		return;
	}
	switch (e.key)
	{
	case "Shift":
		_mode = 0;
		break;
	case " ":
		_dopause = !_dopause;
		break;
	case "s":
		_doskel = !_doskel;
		break;
	case "e":
		_doequip = !_doequip;
		break;
	case "l":
		_dolight = !_dolight;
		break;
	default:
		break;
	}
}
function aoview_mousedown (e)
{
	if (!e.shiftKey)
	{
		_mode = 0;
		if (e.buttons == 3)
		{
			_mode = M_PAN;
		}
		else if (e.buttons == 2)
		{
			_mode = M_DOLLY;
		}
	}
	_held = true;
	_ox = e.clientX;
	_oy = e.clientY;
}
function aoview_mouseup ()
{
	_held = false;
}
function aoview_mouseover (e)
{
	_held = e.buttons != 0;
	if (_held)
	{
		_ox = e.clientX;
		_oy = e.clientY;
	}
}
function aoview_mousemove (e)
{
	if (_inhibit)
	{
		return;
	}
	if (!_held)
	{
		return;
	}
	_mx = e.clientX;
	_my = e.clientY;
	/*Calc relative motion*/
	let dx = 0.2*(_mx - _ox);
	let dy = 0.2*(_my - _oy);
	_ox = _mx;
	_oy = _my;
	switch (_mode)
	{
	case M_LIGHT:
		_light_angles[0] += dx;
		_light_angles[1] += dy;
		break;
	case M_DOLLY:
		_cam_velo[2] += dy;
		break;
	case M_PAN:
		_cam_velo[0] += dx;
		_cam_velo[1] -= dy;
		break;
	default:
		_velo[0] += 30*dx;
		_velo[1] += 30*dy;
		break;
	}
}
async function aoview_init ()
{	
	let shaders = {
		"trans" : "transform.glsl",
		"col" : "colour.glsl",
		"static" : "static.glsl",
		"tex" : "texture.glsl",
		"skin" : "skin.glsl",
		"common" : "common.glsl",
	};
	webgl_init ();
	/*Fire off requests to the files*/
	let req = {};
	Object.keys(shaders).forEach (k => {
		req[k] = webgl_get (shaders[k]);
	});
	/*Create auxillary state*/
	_pm = new Float32Array (16);
	_mm = new Float32Array (16);
	_pmv = new Float32Array (16);
	_cam_angles = new Float32Array ([180, 10, 0]);
	_cam_pos = new Float32Array ([0, 0, 2]);
	_cam_velo = new Float32Array ([0, 0, 0]);
	_light_angles = new Float32Array ([230, 45, 0]);
	_velo = new Float32Array ([0, 0, 0]);
	_colour = [0.3, 0.3, 0.3, 1];
	/*Set up default GL state*/
	gl.enable (gl.DEPTH_TEST);
	gl.enable (gl.CULL_FACE);
	gl.cullFace (gl.FRONT);	/*Stupid D3D bandaide*/
	gl.depthFunc (gl.LEQUAL);
	gl.clearColor (_colour[0], _colour[1], _colour[2], _colour[3]);
	gl.clear (gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
	/*Initialise subsystems*/
	_lines = gl.createBuffer ();
	_time = performance.now ();
	_mode = 0;
	_ox = 0; _oy = 0;
	_mx = 0; _my = 0;
	_held = false;
	/*Parse query string*/
	_equip = {};
	_equip2 = {};
	_breed = null;
	_scale = 1;
	_build = "medium";
	_breed_latched = _breed_info["atrox"];
	let es = parse_qs ();
	if (es)
	{
		let eq = {};
		let face = 0;
		let weap1 = "";
		let weap2 = "";
		Object.keys(es).forEach (k => {
			switch (k)
			{
			case "breed": {
				let b = es[k];
				switch (b)
				{
				case "atrox":
				case "soli_f":
				case "soli_m":
				case "opi_f":
				case "opi_m":
				case "nano_f":
				case "nano_m":
					_breed_latched = _breed_info[b];
					break;
				default:
					break;					
				}
				break;
			}
			case "build":
				switch (es[k])
				{
				case "s": _build = "thin"; break;
				case "l": _build = "fat"; break;
				case "m":
				default:
					_build = "medium";
					break;
				}
				break;
			case "height":
				switch (es[k])
				{
				case "s": _scale = 0.9; break;
				case "l": _scale = 1.1; break;
				case "m":
				default:
					_scale = 1;
					break;
				}
				break;
			case "face": face = parseInt (es[k]); break;
			case "body":
			case "arms":
			case "legs":
			case "feet":
			case "hands":
				eq[k] = "data/textures/" + es[k];
				break;
			case "weap1": weap1 = parseInt (es[k]); break;
			case "weap2": weap2 = parseInt (es[k]); break;
			default:
				break;
			}
		});
		if (weap1 != "")
		{
			let bin = await webgl_get ("data/weapons/" + weap1 + ".abo", true);
			if (bin) _weap1 = load_abo (bin);
		}
		if (weap2 != "")
		{
			let bin = await webgl_get ("data/weapons/" + weap2 + ".abo", true);
			if (bin) _weap2 = load_abo (bin);
		}
		_breed_latched.lasthead = face;
		_equip2 = eq;
	}
	/*Wait for shaders to load*/
	let num = 0;
	let len = Object.keys (req).length;
	let scr = {};
	load_init ("Loading shaders...");
	for (let k of Object.keys (req))
	{
		scr[k] = await req[k];
		load_progress (num/len);
		num++;
	}
	webgl_clear2d ();
	/*Compile shaders*/
	webgl_header_source (scr["common"]);
	_pr_simple = webgl_create_program ("simple", scr["trans"], scr["col"]);
	_pr_static = webgl_create_program ("static", scr["static"], scr["tex"]);
	_pr_skin = webgl_create_program ("skin", scr["skin"], scr["tex"]);
	if (!_pr_simple || !_pr_static || !_pr_skin)
	{
		webgl_fatal ("Failed to create shaders");
	}
	/*Plug in callbacks and away we go!*/
	let cv = document.getElementById ("canvas");
	document.addEventListener ("keydown", aoview_keydown);
	document.addEventListener ("keyup", aoview_keyup);
	document.addEventListener ("mousemove", aoview_mousemove);
	document.addEventListener ("mouseup", aoview_mouseup);
	cv.addEventListener ("mousedown", aoview_mousedown);
	cv.addEventListener ("mouseover", aoview_mouseover);
	cv.addEventListener ("contextmenu", (e) => {
		e.preventDefault ();
		return false;
	});
	/*Cheap UI stuff*/
	let db = document.getElementById ("anims");
	db.addEventListener ("change", () => {
		change_anim (db.value);
	});
	document.getElementById ("ui_atrox").addEventListener ("click", () => {
		_breed_latched = _breed_info["atrox"];
	});
	document.getElementById ("ui_solif").addEventListener ("click", () => {
		_breed_latched = _breed_info["soli_f"];
	});
	document.getElementById ("ui_solim").addEventListener ("click", () => {
		_breed_latched = _breed_info["soli_m"];
	});
	document.getElementById ("ui_opif").addEventListener ("click", () => {
		_breed_latched = _breed_info["opi_f"];
	});
	document.getElementById ("ui_opim").addEventListener ("click", () => {
		_breed_latched = _breed_info["opi_m"];
	});
	document.getElementById ("ui_nanof").addEventListener ("click", () => {
		_breed_latched = _breed_info["nano_f"];
	});
	document.getElementById ("ui_nanom").addEventListener ("click", () => {
		_breed_latched = _breed_info["nano_m"];
	});
	document.getElementById ("ui_sm").addEventListener ("click", () => {
		change_model ("thin");
	});
	document.getElementById ("ui_me").addEventListener ("click", () => {
		change_model ("medium");
	});
	document.getElementById ("ui_lg").addEventListener ("click", () => {
		change_model ("fat");
	});
	document.getElementById ("ui_dn").addEventListener ("click", () => {
		_scale -= 0.1;
		if (_scale <= 0.9) _scale = 0.9;
	});
	document.getElementById ("ui_up").addEventListener ("click", () => {
		_scale += 0.1;
		if (_scale >= 1.1) _scale = 1.1;
	});
	document.getElementById ("ui_prev").addEventListener ("click", () => {
		if (--_breed.lasthead < 0) 
			_breed.lasthead = 0;
		change_head (_breed.lasthead);
	});
	document.getElementById ("ui_next").addEventListener ("click", () => {
		if (++_breed.lasthead >= _breed.heads) 
			_breed.lasthead = _breed.heads - 1;
		change_head (_breed.lasthead);
	});
	window.requestAnimationFrame (aoview_frame);
}
aoview_init ();
