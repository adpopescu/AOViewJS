function tofloat32 (x)
{
	let s = (x>>15)&1;
	let e = (x>>10)&0x1f;
	if (0 == e)
	{
		return s ? -0 : 0;
	}
	let m = (x&0x3ff)/1024.0;
	if (0x1f != e)
	{
		let y;
		if (0 == e) y = Math.pow (2,-14)*m;
		else y = Math.pow (2, e - 15)*(1 + m);
		return s ? -y : y;
	}
	/*Special cases*/
	if (m != 0) return NaN;
	return Infinity;
}

function Binary_reader (binary)
{
	this.dv = new DataView (binary);
	this.ofs = 0;
	this.getint = function ()
	{
		let x = this.dv.getUint32 (this.ofs, true);
		this.ofs += 4;
		return x;
	};
	this.getint16 = function ()
	{
		let x = this.dv.getUint16 (this.ofs, true);
		this.ofs += 2;
		return x;
	};
	this.getfloat = function ()
	{
		let x = this.dv.getFloat32 (this.ofs, true);
		this.ofs += 4;
		return x;
	};
	this.getvector = function (r)
	{
		let x = [];
		for (let i = 0; i < r; i++) x.push (this.getfloat ());
		return x;
	};
	this.getslice = function (len)
	{
		let buf = this.dv.buffer.slice (this.ofs, this.ofs + len);
		this.ofs += len;
		return buf;
	};
	this.getarray = function (elem)
	{
		return this.getslice (elem*this.getint ());
	};
	this.getstring = function ()
	{
		return String.fromCharCode.apply (
			null,
			new Uint8Array (this.getarray (1))
		);
	};
}
/**
 * Parses URL"s current Query String and returns an object of key/value pairs
 * @example
 *      url: ?body=123&test=Hello
 *      returns: {body: 123, test: "Hello"}
 * @returns prototype.Object
 */
function parse_qs() {
	let path_half = window.location.href.split("?");
	if(path_half[1]) { // querystring exists
		let kv = {};
		let qs = path_half[1].split("&");
		for (let q in qs) {
			let pair = qs[q].split("=");
			let value = pair[1];
			if (parseInt(value)) value = parseInt(value); // convert to int is if parses
			kv[pair[0]] = value;
		}
		return kv;
	}
	return null;
}

