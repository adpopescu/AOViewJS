#!bash
if [ "$1" = "release" ]; then
	cat webgl.js math.js utils.js files.js static.js aoview.js > tmp.js
	uglifyjs --compress --mangle -- tmp.js > lib.js
	rm tmp.js
else
	cat webgl.js math.js utils.js files.js static.js aoview.js > lib.js
fi

echo "Copying files to site..."
if [ ! -d "site" ]; then
	mkdir site
fi
cp *.glsl site
cp lib.js site
cp index.html site