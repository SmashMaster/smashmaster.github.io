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
var aspectRatio;
var gl;
var shader, fsqBuffer;

function onResize() {
    try {
        width = canvas.width();
        height = canvas.height();
        aspectRatio = width/height;
        canvas[0].width = width;
        canvas[0].height = height;
    }
    catch (e) {
        //alert("Resize error: " + e);
    }
}

function reqSource(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
}

function loadShader(src, type) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw gl.getShaderInfoLog(sh);
    }
    return sh;
}

function makeShader() {
    var vertSource = reqSource("shaders/blob.vert");
    var fragSource = reqSource("shaders/blob.frag");
    var fragmentShader = loadShader(fragSource, gl.FRAGMENT_SHADER);
    var vertexShader = loadShader(vertSource, gl.VERTEX_SHADER);
    
    shader = gl.createProgram();
    gl.attachShader(shader, vertexShader);
    gl.attachShader(shader, fragmentShader);
    gl.linkProgram(shader);
    
    if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(shader);
    }
    
    gl.useProgram(shader);

    shader.vertexPositionAttribute = gl.getAttribLocation(shader, "in_pos");
    gl.enableVertexAttribArray(shader.vertexPositionAttribute);
    
    shader.uniformTimeLocation = gl.getUniformLocation(shader, "u_time");
    shader.uniformAspectRatioLocation = gl.getUniformLocation(shader, "u_aspect_ratio");
}

function makeVBO() {
    fsqBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fsqBuffer);
    vertices = [
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    fsqBuffer.itemSize = 2;
    fsqBuffer.numItems = 4;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, fsqBuffer);
    gl.vertexAttribPointer(shader.vertexPositionAttribute, fsqBuffer.itemSize, gl.FLOAT, false, 0, 0);
}

var startTime = 0;

function animate() {
    var currentTime = (new Date).getTime();
    if (!startTime || (currentTime - startTime) >= 1200000) {
        startTime = currentTime;
    }
    var time = (currentTime - startTime)/1000.0;
    
    try {
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.uniform1f(shader.uniformTimeLocation, time);
        gl.uniform1f(shader.uniformAspectRatioLocation, aspectRatio);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, fsqBuffer.numItems);
        
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        //alert("Animate error: " + e);
    }
}

function main() {
    try {
        canvas = $("#demo");
        onResize();
        addEvent(window, "resize", onResize);
        
        gl = canvas[0].getContext('experimental-webgl');
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        
        makeShader();
        makeVBO();
        
        canvas.fadeIn("slow", function() {
            $("#spinner").fadeOut("fast");
        });
        
        window.requestAnimationFrame(animate);
    }
    catch (e) {
        $("#demoWrapper").hide();
        //alert("Load error in main(): " + e);
    }
}
