var gl;
var wgl_canvas;
var wgl_hud, wgl_2d;
var wgl_header;

var wgl_tmu = [-1, -1, -1, -1];

var wgl_image_canvas = document.createElement ("canvas");
var wgl_image_ctx = wgl_image_canvas.getContext ("2d");

var wgl_pending_images = [];

function webgl_log (text)
{
	document.getElementById ("dbg").innerHTML = text;
}
function webgl_fatal (text)
{
	wgl_2d.fillStyle = "red";
	wgl_2d.fillRect (0, 0, wgl_canvas.width, wgl_canvas.height);
	wgl_2d.font = "bold 64px sans-serif";
	wgl_2d.fillStyle = "black";
	wgl_2d.textAlign = "center";
	wgl_2d.fillText ("誤", wgl_canvas.width/2, wgl_canvas.height/2);
	wgl_2d.font = "0.7em sans-serif";
	wgl_2d.fillText (text, wgl_canvas.width/2, wgl_canvas.height/2 + 32);
	throw new Error (text);
}
function webgl_get (url, binary, cb)
{	/*Set default values if needed*/
	if (binary == null && typeof binary == "undefined")
	{
		binary = false;
	}
	if (cb == null && typeof cb == "undefined")
	{
		cb = null;
	}
	/*Make a promise to get the file for the code*/
	return new Promise ((resolve, reject) => {
		let rq = new XMLHttpRequest ();
		rq.addEventListener ("load", () => {
			let res;
			if (binary) res = rq.response;
			else res = rq.responseText;
			if (cb != null)
			{
				cb (res);
			}
			resolve (res);
		});
		rq.addEventListener ("error", () => {
			reject ("Error during transmit");
		});
		rq.addEventListener ("abort", () => {
			reject ("User aborted operation");
		});
		rq.addEventListener ("timeout", () => {
			reject ("Operation timed out");
		});
		rq.responseType = binary ? "arraybuffer" : "text";
		rq.open ("GET", url);
		rq.send ();
	});
}
function webgl_clear2d ()
{	/*Clear canvas*/
	wgl_2d.clearRect (0, 0, wgl_hud.width, wgl_hud.height);
	/*Add watermarks back in*/
	wgl_2d.font = "10px sans-serif";
	wgl_2d.fillStyle = "#fff";
	wgl_2d.textAlign = "left";
	wgl_2d.fillText ("Program by Team Raging", 20, wgl_hud.height - 4);
	wgl_2d.textAlign = "right";
	wgl_2d.fillText ("Art by Funcom", wgl_hud.width - 20, wgl_hud.height - 4);
}
function webgl_header_source (text)
{
	wgl_header = text;
}
function webgl_create_program (name, vert, frag, flags)
{
	if (flags == null && typeof flags == "undefined")
	{
		flags = "";
	}
	function create_shader (src, type)
	{
		let sh = gl.createShader (type);
		gl.shaderSource (sh, src);
		gl.compileShader (sh);
		if (!gl.getShaderParameter (sh, gl.COMPILE_STATUS))
		{
			webgl_log (
				"Compile error: " + name + " : " + gl.getShaderInfoLog (sh)
			);
			gl.deleteShader (sh);
			return null;
		}
		return sh;
	}
	/*Generate config from flags*/
	let conf = "";
	if (flags != "")
	{
		let fu = flags.split (" ");
		fu.forEach (fl => { 
			let s = "#define " + fl + " 1\n";
			conf += s;
		});
	}
	conf += "\n#line 1\n";
	/*Include header and compile the shaders*/
	let vsh = create_shader (wgl_header + conf + vert, gl.VERTEX_SHADER);
	let fsh = create_shader (wgl_header + conf + frag, gl.FRAGMENT_SHADER);
	if (!vsh || !fsh)
	{
		if (vsh) gl.deleteShader (vsh);
		if (fsh) gl.deleteShader (fsh);
		return null;
	}
	/*Create a program object and link the shaders together.
	Shaders aren't needed anymore after being linked.*/
	let prog = gl.createProgram ();
	gl.attachShader (prog, vsh);
	gl.attachShader (prog, fsh);
	gl.linkProgram (prog);
	gl.detachShader (prog, vsh); gl.deleteShader (vsh);
	gl.detachShader (prog, fsh); gl.deleteShader (fsh);
	if (!gl.getProgramParameter (prog, gl.LINK_STATUS))
	{
		webgl_log (
			"Link error: " + name + " : " + gl.getProgramInfoLog (prog)
		);
		gl.deleteProgram (prog);
		return null;
	}
	gl.useProgram (prog);
	/*Bind uniforms*/
	let bu = {};
	let nu = gl.getProgramParameter (prog, gl.ACTIVE_UNIFORMS);
	for (let i = 0; i < nu; i++)
	{
		let u = gl.getActiveUniform (prog, i);
		let name = u.name.split ("[")[0];
		bu[name] = gl.getUniformLocation (prog, name);
	}
	/*Bind attributes*/
	let ba = {};
	let na = gl.getProgramParameter (prog, gl.ACTIVE_ATTRIBUTES);
	for (let i = 0; i < na; i++)
	{
		let a = gl.getActiveAttrib (prog, i);
		ba[a.name] = i;
	}
	/*Done!*/
	return {
		_prog: prog,
		uniform: bu,
		attribute: ba
	};
}
function webgl_image (file, cb)
{
	if (cb == null && typeof cb == "undefined")
	{
		cb = null;
	}
	let handle = gl.createTexture ();
	let p = new Promise (resolve => {
		let prevuri = "";
		let image = new Image ();
		image.addEventListener ("error", () => {
			let url = file + ".png";
			if (prevuri != url)
			{
				image.src = url;
				prevuri = url;
				return;
			}
			webgl_log ("Failed to find .jpg or .png for " + url);
			resolve (false);
		});
		image.addEventListener ("load", () => {
			/*Convert transparency colours... The Javascript Way*/
			wgl_image_ctx.canvas.width = image.width;
			wgl_image_ctx.canvas.height = image.height;
			wgl_image_ctx.drawImage (image, 0, 0);
			let cd = wgl_image_ctx.getImageData (
				0, 0, 
				image.width, image.height
			);
			let pix = cd.data;
			for (let i = 0; i < image.height; i++)
			{
				for (let j = 0; j < image.width; j++)
				{
					let k = (i*image.width + j)<<2;
					let c = (pix[k]<<16)|(pix[k + 1]<<8)|pix[k + 2];
					if (0x00ff00 == c)
					{/*Green is transparent*/
						pix[k + 3] = 0x00;
					}
				}
			}
			wgl_image_ctx.putImageData (cd, 0, 0);
			let res = new Image ();
			res.src = wgl_image_canvas.toDataURL ();
			res.addEventListener ("load", () => {
				/*Upload the result to OGL*/
				gl.activeTexture (gl.TEXTURE3);
				gl.bindTexture (gl.TEXTURE_2D, handle);
				gl.texImage2D (
					gl.TEXTURE_2D,
					0,
					gl.RGBA,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					res
				);
				gl.texParameteri (
					gl.TEXTURE_2D, 
					gl.TEXTURE_MAG_FILTER,
					gl.LINEAR
				);
				gl.texParameteri (
					gl.TEXTURE_2D,
					gl.TEXTURE_MIN_FILTER,
					gl.LINEAR
				);
				if (cb != null)
				{
					cb (handle);
				}
				resolve (true);
			});
		});
		image.src = file + ".jpg";
	});
	wgl_pending_images.push (p);
	return handle;
}
function webgl_pending_images (cb)
{
	if (cb == undefined) cb = null;
	return Promise.all (wgl_pending_images)
	.then (() => {
		wgl_pending_images.length = 0;
		if (cb) cb ();
	});
}
function webgl_bindtexture (tmu, handle)
{
	if (tmu < 0 || tmu >= wgl_tmu.length)
	{
		webgl_log ("Trying to use invalid TMU!");
		return;
	}
	gl.activeTexture (gl.TEXTURE0 + tmu);
	if (wgl_tmu[tmu] != handle)
	{
		gl.bindTexture (gl.TEXTURE_2D, handle);
		wgl_tmu[tmu] = handle;
	}
}
function webgl_init ()
{
	let div = document.getElementById ("canvas").children;
	/*Create 2D context for text and stuff*/
	wgl_hud = div.namedItem ("hud");
	wgl_2d = wgl_hud.getContext ("2d");
	if (!wgl_2d)
	{
		throw new Error ("Failed to initialise 2D canvas");
	}
	webgl_clear2d ();
	/*Create GL context for the stupid canvas*/
	wgl_canvas = div.namedItem ("gfx");
	gl = wgl_canvas.getContext ("webgl");
	if (!gl)
	{
		webgl_fatal ("Failed to initalise WebGL");
	}
}

