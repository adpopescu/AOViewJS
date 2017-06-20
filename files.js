/*Used for heads, guns, armour...*/
function load_abo (binary)
{
	let f = new Binary_reader (binary);
	let MAGICK = 0x214f4241;
	let VERSION = 0x20170503;
	if (f.getint () != MAGICK)
	{
		webgl_log ("Mismatched model magick!");
		return null;
	}
	if (f.getint () != VERSION)
	{
		webgl_log ("Mismatched model version!");
		return null;
	}
	let nnames = f.getint ();
	let names = [];
	for (let i = 0; i < nnames; i++)
	{
		names.push (f.getarray (1));
	}
	let nskin = f.getint ();
	let skn = [];
	for (let i = 0; i < nskin; i++)
	{
		let map = f.getint ();
		f.getint ();
		skn.push (webgl_image ("data/textures/" + map.toString ()));
	}	
	let nmats = f.getint ();
	let mats = [];
	for (let i = 0; i < nmats; i++)
	{
		f.getint ();
		mats.push ({
			diffuse: f.getvector (3),
			ambient: f.getvector (3),
			emissive: f.getvector (3),
			specular: f.getvector (3),
			shine: f.getfloat (),
			alpha: f.getfloat ()
		});
	}
	let nmesh = f.getint ();
	let m = [];
	for (let i = 0; i < nmesh; i++)
	{
		let index = f.getint ();
	
		let v = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, v);
		gl.bufferData (gl.ARRAY_BUFFER, f.getarray (32), gl.STATIC_DRAW);
		
		let n = gl.createBuffer ();
		let data = new Uint16Array (f.getarray (2));
		gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, n);
		gl.bufferData (
			gl.ELEMENT_ARRAY_BUFFER,
			data,
			gl.STATIC_DRAW
		);
		
		m.push ({
			slot: index,
			verts: v,
			nindices: data.length,
			indices: n 
		});
	}
	return {
		skin: skn,
		materials: mats,
		meshes: m
	};
}
/*Animated meshes*/
function load_cir2 (binary)
{
	let f = new Binary_reader (binary);
	let MAGICK = 0x32524943;
	let VERSION = 0x20170313;
	if (f.getint () != MAGICK)
	{
		webgl_log ("Mismatched model magick!");
		return null;
	}
	if (f.getint () != VERSION)
	{
		webgl_log ("Mismatched model version!");
		return null;
	}
	/*Skip names*/
	let nnames = f.getint ();
	let names = [];
	for (let i = 0; i < nnames; i++)
	{
		names.push (f.getstring ());
	}
	/*Read materials*/
	let mats = {};
	let slots = [];
	let nmats = f.getint ();
	for (let i = 0; i < nmats; i++)
	{
		let key = names[f.getint ()];
		slots.push (key);
		mats[key] = {
			ambient: f.getvector (3),
			diffuse: f.getvector (3),
			specular: f.getvector (3),
			emissive: f.getvector (3),
			shine: f.getfloat (),
			alpha: f.getfloat ()
		};
	}
	/*Read bones*/
	let b = [];
	let nbones = f.getint ();
	for (let i = 0; i < nbones; i++)
	{
		f.getint ();
		b.push ({
			parent: f.getint (),
			scale: f.getfloat ()
		});
	}
	/*Read attractors*/
	let att = {};
	let natt = f.getint ();
	for (let i = 0; i < natt; i++)
	{
		let key = names[f.getint ()];
		att[key] = {
			id: f.getint (),
			or: f.getvector (4),
			tr: f.getvector (3),
		};
	}
	/*Read meshes*/
	let m = [];
	let nmeshes = f.getint ();
	for (let i = 0; i < nmeshes; i++)
	{
		let s = f.getint ();
		let v = f.getarray (40);
		let n = new Uint16Array (f.getarray (2));
		/*Create buffers*/
		let b1 = gl.createBuffer ();
		gl.bindBuffer (gl.ARRAY_BUFFER, b1);
		gl.bufferData (gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
		let b2 = gl.createBuffer ();
		gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, b2);
		gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, n, gl.STATIC_DRAW);
		m.push ({
			slot: slots[s],
			verts: b1,
			nindices: n.length,
			indices: b2,
		});
	}
	/*Put it all together*/
	return {
		bones: b,
		materials: mats,
		attractors: att,
		meshes: m
	};
}
function load_cir2anim (binary)
{
	let f = new Binary_reader (binary);
	let MAGICK = 0x32494e41;
	let VERSION = 0x20170318;
	if (f.getint () != MAGICK)
	{
		webgl_log ("Mismatched animation magick!");
		return null;
	}
	if (f.getint () != VERSION)
	{
		webgl_log ("Mismatched animation version!");
		return null;
	}
	let len = f.getfloat ();
	let nb = f.getint ();
	let b = [];
	for (let i = 0; i < nb; i++)
	{	/*Rotation keys*/
		let rot = [];
		let d1 = new Binary_reader (f.getarray (12));
		let nrot = d1.dv.buffer.byteLength/12;
		for (let j = 0; j < nrot; j++)
		{
			rot.push ({
				time: d1.getfloat (),
				or: [
					tofloat32 (d1.getint16 ()), 
					tofloat32 (d1.getint16 ()),
					tofloat32 (d1.getint16 ()),
					tofloat32 (d1.getint16 ())
				]
			});
		}
		/*Position keys*/
		let pos = [];
		let d2 = new Binary_reader (f.getarray (16));
		let npos = d2.dv.buffer.byteLength/16;
		for (let j = 0; j < npos; j++)
		{
			pos.push ({
				time: d2.getfloat (),
				tr: [
					d2.getfloat (), 
					d2.getfloat (),
					d2.getfloat ()
				]
			});
		}
		/*Mint a new curve*/
		b.push ({
			r: {data: rot, index: 0},
			p: {data: pos, index: 0},
		});
	}
	/*Put everything together*/
	return {
		length: len,
		bones: b
	};
}
