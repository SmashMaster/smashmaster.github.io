/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2016 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

/* Browser update prompt: https://browser-update.org/ */
var $buoop = {c:2}; 
function $buo_f(){ 
 var e = document.createElement("script"); 
 e.src = "//browser-update.org/update.min.js"; 
 document.body.appendChild(e);
};
try {document.addEventListener("DOMContentLoaded", $buo_f,false)}
catch(e){window.attachEvent("onload", $buo_f)}

/* requestAnimationFrame polyfill - https://gist.github.com/paulirish/1579671 */
/* MIT license */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
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

var canvas;
var width, height;
var gl;

function onResize() {
    try {
        width = canvas.width();
        height = canvas.height();
        canvas[0].width = width;
        canvas[0].height = height;
    }
    catch (e) {
        alert("Resize error: " + e);
    }
}

function reqSource(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
}

function loadShader(src, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(shader);
    }

    return shader;
}


var startTime = 0;

function animate() {
    var currentTime = (new Date).getTime();
    if (!startTime || (currentTime - startTime) >= 1200000) {
        startTime = currentTime;
    }
    var time = (currentTime - startTime)/1000.0
    
    try {
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        alert("Animate error: " + e);
    }
}

function main() {
    try {
        canvas = $("#demo");
        onResize();
        addEvent(window, "resize", onResize);
        
        gl = canvas[0].getContext('experimental-webgl');
        
        var vertSource = reqSource("shaders/blob.vert");
        var fragSource = reqSource("shaders/blob.frag");
        var fragmentShader = loadShader(drawer, fragSource, gl.FRAGMENT_SHADER);
        var vertexShader = loadShader(drawer, vertSource, gl.VERTEX_SHADER);
        
        drawer.shader = gl.createProgram();
        gl.attachShader(drawer.shader, vertexShader);
        gl.attachShader(drawer.shader, fragmentShader);
        gl.linkProgram(drawer.shader);
        
        canvas.fadeIn("slow", function() {
            $("#spinner").fadeOut("fast");
        });
        
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        $("#demoWrapper").hide();
        
        alert("Load error in main(): " + e);
    }
}
