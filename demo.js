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

function initBuffer(drawer) {
    var gl = drawer.gl;
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
}

function getShader(drawer, url, type) {
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

function initShader(drawer) {
    var gl = drawer.gl;
    var fragmentShader = getShader(drawer, "shader.frag", gl.FRAGMENT_SHADER);
    var vertexShader = getShader(drawer, "shader.vert", gl.VERTEX_SHADER);
    
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
}

function draw(drawer) {
    var gl = drawer.gl;
    gl.viewport(0, 0, drawer.width, drawer.height);
    
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, drawer.quadBuffer);
    gl.vertexAttribPointer(drawer.shader.vertexPositionAttribute, drawer.quadBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, drawer.quadBuffer.numItems);
}

function resize(drawer) {
    drawer.width = drawer.canvas.width();
    drawer.height = drawer.canvas.height();
    drawer.canvas[0].width = drawer.width;
    drawer.canvas[0].height = drawer.height;
}

function onResize() {
    try {
        resize(sunDrawer);
        resize(planetDrawer);
        resize(moonDrawer);
    }
    catch (e) {
        alert(e);
    }
}

function animate() {
    try {
        draw(sunDrawer);
        draw(planetDrawer);
        draw(moonDrawer);
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        alert(e);
    }
}

function makeDrawer(canvasName) {
    var drawer = {};
    drawer.canvas = $(canvasName);
    drawer.gl = drawer.canvas[0].getContext('experimental-webgl');
    drawer.center = function() {
        var offset = this.canvas.offset();
        var width = this.canvas.width();
        var height = this.canvas.height();
        
        return {x:offset.left + width/2.0, y:-offset.top - height/2.0};
    }
    initShader(drawer);
    initBuffer(drawer);
    resize(drawer);
    return drawer;
}

var sunDrawer, planetDrawer, moonDrawer;

function main() {
    try {
        sunDrawer = makeDrawer("#sun-canvas");
        planetDrawer = makeDrawer("#planet-canvas");
        moonDrawer = makeDrawer("#moon-canvas");
        
        addEvent(window, "resize", onResize);
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        alert(e);
    }
}
