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
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function onResize() {
}

function animate() {
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
    
    initBuffer(drawer);
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
