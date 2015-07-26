/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

/* requestAnimationFrame polyfill - https://gist.github.com/paulirish/1579671 */
/* MIT license */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function addEvent(elem, type, eventHandle) {
    if (elem == null || typeof(elem) == 'undefined') return;
    if (elem.addEventListener) {
        elem.addEventListener(type, eventHandle, false);
    } else if (elem.attachEvent) {
        elem.attachEvent( "on" + type, eventHandle );
    } else {
        elem["on"+type]=eventHandle;
    }
}

function loadShader(drawer, url, type) {
    var req = new XMLHttpRequest();
    //req.open("GET", url, false);
    req.open("GET", url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime(), false); //Bypass cache
    req.send(null);
    var src = (req.status == 200) ? req.responseText : null;

    var gl = drawer.gl;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(shader);
    }

    return shader;
}

function loadTexture(drawer, url, wrap) {
    drawer.loading++;
    var gl = drawer.gl;
    var texture = gl.createTexture();
    
    var image = new Image();
    $(image).one('load', function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
        drawer.loading--;
    });
    image.src = url;
    
    return texture;
}

var SUN_COLOR_DWARF = {x:1.0, y:1.1, z:1.2};
var SUN_COLOR_MAIN = {x:1.0, y:0.78, z:0.44};
var SUN_COLOR_GIANT = {x:1.0, y:0.2, z:0.1};
var SUN_SIZE_MIN = 0.125, SUN_SIZE_MAIN = 0.25, SUN_SIZE_MAX = 0.65;
var SUN_SMID = (SUN_SIZE_MAIN - SUN_SIZE_MIN)/(SUN_SIZE_MAX - SUN_SIZE_MIN);

var sunScaleSlider;
var cloudTexture;
var sunDrawer, planetDrawer, moonDrawer;
var curSunColor = {x:0.0, y:0.0, z:0.0};

function makeDrawer(canvasName, shaderName) {
    var drawer = {};
    drawer.loading = 1;
    drawer.canvas = $(canvasName);
    var gl = drawer.canvas[0].getContext('experimental-webgl');
    drawer.gl = gl;
    
    //INIT SHADERS
    var fragmentShader = loadShader(drawer, "shaders/" + shaderName + ".frag", gl.FRAGMENT_SHADER);
    var vertexShader = loadShader(drawer, "shaders/shader.vert", gl.VERTEX_SHADER);
    
    drawer.shader = gl.createProgram();
    gl.attachShader(drawer.shader, vertexShader);
    gl.attachShader(drawer.shader, fragmentShader);
    gl.linkProgram(drawer.shader);

    if (!gl.getProgramParameter(drawer.shader, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(shader);
    }
    
    gl.useProgram(drawer.shader);

    drawer.shader.vertexPositionAttribute = gl.getAttribLocation(drawer.shader, "in_pos");
    gl.enableVertexAttribArray(drawer.shader.vertexPositionAttribute);
    
    //INIT VERTEX BUFFER
    drawer.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, drawer.quadBuffer);
    vertices = [
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    drawer.quadBuffer.itemSize = 2;
    drawer.quadBuffer.numItems = 4;
    
    //INIT FUNCTIONS
    drawer.resize = function() {
        this.width = this.canvas.width();
        this.height = this.canvas.height();
        this.canvas[0].width = this.width;
        this.canvas[0].height = this.height;
    }
    drawer.resize();
    
    drawer.center = function() {
        var offset = this.canvas.offset();
        return {x:offset.left + this.width/2.0, y:-offset.top - this.height/2.0};
    }
    
    drawer.radius = function() {
        return (this.width + this.height)/2.0;
    }
    
    drawer.relRadius = function(d) {
        return this.radius()/d.radius();
    }
    
    drawer.relPosition = function(d) {
        var drawCenter = d.center();
        var center = this.center();
        return {x:2.0*(drawCenter.x - center.x)/this.width, 
                y:2.0*(drawCenter.y - center.y)/this.height};
    }
    
    drawer.uLoc = function(name) {
        return gl.getUniformLocation(this.shader, "u_" + name);
    }
    
    drawer.draw = function(time) {
        if (this.loading) return;
    
        var gl = this.gl;
        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        if (this.onDraw) this.onDraw(time);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.vertexAttribPointer(this.shader.vertexPositionAttribute, this.quadBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.quadBuffer.numItems);
    }
    
    return drawer;
}

function onResize() {
    try {
        sunDrawer.resize();
        planetDrawer.resize();
        moonDrawer.resize();
    }
    catch (e) {
        alert("Resize error: " + e);
    }
}

function sunLerp(a, b, c, t) {
    if (t <= 0.0) return a;
    else if (t >= 1.0) return c;
    
    if (t >= SUN_SMID) {
        var rt = (t - SUN_SMID)/(1.0 - SUN_SMID);
        return b + (c - b)*rt;
    }
    else {
        var rt = t/SUN_SMID;
        return a + (b - a)*rt;
    }
}

function calcSunColor() {
    var sunSize = sunScaleSlider.noUiSlider.get();
    var t = (sunSize - SUN_SIZE_MIN)/(SUN_SIZE_MAX - SUN_SIZE_MIN);
    curSunColor.x = sunLerp(SUN_COLOR_DWARF.x, SUN_COLOR_MAIN.x, SUN_COLOR_GIANT.x, t);
    curSunColor.y = sunLerp(SUN_COLOR_DWARF.y, SUN_COLOR_MAIN.y, SUN_COLOR_GIANT.y, t);
    curSunColor.z = sunLerp(SUN_COLOR_DWARF.z, SUN_COLOR_MAIN.z, SUN_COLOR_GIANT.z, t);
}

var startTime = 0;

function animate() {
    var currentTime = (new Date).getTime();
    if (!startTime || (currentTime - startTime) >= 1200000) {
        startTime = currentTime;
    }
    var time = (currentTime - startTime)/1000.0
    
    try {
        calcSunColor();
        sunDrawer.draw(time);
        planetDrawer.draw(time);
        moonDrawer.draw(time);
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        alert("Animate error: " + e);
    }
}

function initSunScaleSlider() {
    sunScaleSlider = $("#sun-scale-slider")[0];
    
    noUiSlider.create(sunScaleSlider, {
		start: SUN_SIZE_MAIN,
		orientation: "horizontal",
		range: {
			'min': SUN_SIZE_MIN,
			'max': SUN_SIZE_MAX
		}
	});
}

function loadSun() {
    sunDrawer = makeDrawer("#sun-canvas", "sun");
    var gl = sunDrawer.gl;
    sunDrawer.texture = loadTexture(sunDrawer, "clouds.png", gl.REPEAT);
    sunDrawer.onDraw = function(time) {
        gl.uniform3f(this.uLoc("sun_light_color"), curSunColor.x, curSunColor.y, curSunColor.z);
        gl.uniform1f(this.uLoc("size_factor"), sunScaleSlider.noUiSlider.get());
        gl.uniform1f(this.uLoc("time"), time);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
    sunDrawer.radius = function() {
        return (this.width + this.height)*sunScaleSlider.noUiSlider.get()/2.0;
    }
    sunDrawer.loading--;
}

function loadPlanet() {
    planetDrawer = makeDrawer("#planet-canvas", "planet");
    var gl = planetDrawer.gl;
    planetDrawer.albedoTexture = loadTexture(planetDrawer, "planet_albedo.png", gl.REPEAT);
    planetDrawer.normalTexture = loadTexture(planetDrawer, "planet_normals.png", gl.REPEAT);
    planetDrawer.onDraw = function(time) {
        gl.uniform1i(this.uLoc("tex_albedo"), 0);
        gl.uniform1i(this.uLoc("tex_normals"), 1);
        gl.uniform3f(this.uLoc("sun_light_color"), curSunColor.x, curSunColor.y, curSunColor.z);
        gl.uniform1f(this.uLoc("sun_radius"), sunDrawer.relRadius(this));
        gl.uniform1f(this.uLoc("moon_radius"), moonDrawer.relRadius(this));
        var sunPos = this.relPosition(sunDrawer);
        gl.uniform2f(this.uLoc("sun_pos"), sunPos.x, sunPos.y);
        var moonPos = this.relPosition(moonDrawer);
        gl.uniform2f(this.uLoc("moon_pos"), moonPos.x, moonPos.y);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.albedoTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
    }
    planetDrawer.loading--;
}

function loadMoon() {
    moonDrawer = makeDrawer("#moon-canvas", "moon");
    var gl = moonDrawer.gl;
    moonDrawer.texture = loadTexture(moonDrawer, "moon_normals.png", gl.REPEAT);
    moonDrawer.onDraw = function(time) {
        gl.uniform3f(this.uLoc("sun_light_color"), curSunColor.x, curSunColor.y, curSunColor.z);
        gl.uniform1f(this.uLoc("sun_radius"), sunDrawer.relRadius(this));
        gl.uniform1f(this.uLoc("planet_radius"), planetDrawer.relRadius(this));
        var sunPos = this.relPosition(sunDrawer);
        gl.uniform2f(this.uLoc("sun_pos"), sunPos.x, sunPos.y);
        var planetPos = this.relPosition(planetDrawer);
        gl.uniform2f(this.uLoc("planet_pos"), planetPos.x, planetPos.y);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
    moonDrawer.loading--;
}

function main() {
    try {
        initSunScaleSlider();
        loadSun();
        loadPlanet();
        loadMoon();
        
        addEvent(window, "resize", onResize);
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        alert("Load error: " + e);
    }
}
