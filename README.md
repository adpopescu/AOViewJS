### AOViewJS
***
Are you a hipster? Can't understand C? Does the concept of a pointer give you a 
headache? No problem! Team Raging is proud to present AOView - Javascript 
flavour! This little abomination will bring pain to your broken brain! No 
frameworks, no libraries - 'how does this thing even work?!' you might ask.


It's because we're just that good.


### Usage
***
If you're using Firefox, then you just have to open the index.html and it 
should just work. AOViewJS were written on Firefox.


If you're using Chrome, then things get a little stickier. If you have Python 2
then you can do `python -m SimpleHTTPServer` in the directory to host the app
on a local webserver, which you may connect to via localhost:8000 or similar.


On Python3 the equivalent command is `python -m http.server`


Other browsers were not tested, because no one could be arsed to do so.


### Hacking
***
You will need `npm` installed, afterward you can grab `uglify-es` from their
repos. Once it's installed you can just run `./join release` to generate a 
compressed version of the code for release. `./join` by itself will just cat
all the source files together without any compression - useful for debugging.


You might also wanna grab `eslint` from the repo as well. You'll need to set 
them both up to use ES6, or ES7 - or something. It turns out Javascript is an 
amorphous chaotic beast: features bleed in and out between specs, taking shape 
and being reshaped with each passing moment. So there's a lot of features from
different specs in play - some of which are still in draft - so the fact this 
thing runs at all is a miracle, and even more so just getting it to lint.


That aside the code is straight forward for what it is, so if you _actually_
know what you're doing then there shouldn't be any problems getting it to do 
what you want.


### Legalese
***
This program is itself an all original work, and is released to the public 
under a permissive license whose terms can be read in the LICENSE.md file. 
The art assets, however, are sole property of Funcom, whom we are not 
affiliated with in any way, and so are not included in our official releases.


### Special THANKS
***
As always, thanks to our friends and families for their continued support. 
Shout outs to all the cool people in AO - you know who you are - and of course,
kudos to Funcom for making it all happen in the first place.


And with that we're done. Good luck and half fun.


Riding off into the sunset,


Team Raging

