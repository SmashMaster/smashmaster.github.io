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
    req.open("GET", url, false);
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

var sunDrawer, planetDrawer, moonDrawer;

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
        var width = this.canvas.width();
        var height = this.canvas.height();
        
        return {x:offset.left + width/2.0, y:-offset.top - height/2.0};
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

var startTime = 0;

function animate() {
    var currentTime = (new Date).getTime();
    if (!startTime || (currentTime - startTime) >= 1200000) {
        startTime = currentTime;
    }
    var time = (currentTime - startTime)/1000.0
    
    try {
        sunDrawer.draw(time);
        planetDrawer.draw(time);
        moonDrawer.draw(time);
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        alert("Animate error: " + e);
    }
}

function loadSun() {
    sunDrawer = makeDrawer("#sun-canvas", "sun");
    var gl = sunDrawer.gl;
    sunDrawer.texture = loadTexture(sunDrawer, "clouds.png", gl.REPEAT);
    sunDrawer.onDraw = function(time) {
    
        gl.uniform1f(gl.getUniformLocation(this.shader, "u_time"), time);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
    sunDrawer.loading--;
}

function loadPlanet() {
    planetDrawer = makeDrawer("#planet-canvas", "planet");
    planetDrawer.loading--;
}

function loadMoon() {
    moonDrawer = makeDrawer("#moon-canvas", "moon");
    moonDrawer.loading--;
}

function main() {
    try {
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
