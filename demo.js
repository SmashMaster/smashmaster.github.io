var startTime, currentTime;
var gl;
var cloudTexture, nameTexture;

/*requestAnimationFrame polyfill - https://gist.github.com/paulirish/1579671 */
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
    if ( elem.addEventListener ) {
        elem.addEventListener( type, eventHandle, false );
    } else if ( elem.attachEvent ) {
        elem.attachEvent( "on" + type, eventHandle );
    } else {
        elem["on"+type]=eventHandle;
    }
}

function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

function onResize() {
    if (!gl) return;
    
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewportWidth = gl.canvas.width;
    gl.viewportHeight = gl.canvas.height;
};

function handleTextureLoaded(image, texture, wrap) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTextures() {
    cloudTexture = gl.createTexture();
    var cloudImage = new Image();
    $(cloudImage).one('load', function() {
        handleTextureLoaded(cloudImage, cloudTexture, gl.REPEAT);
    });
    cloudImage.src = "clouds.png";
    
    nameTexture = gl.createTexture();
    var nameImage = new Image();
    $(nameImage).one('load', function() {
        handleTextureLoaded(nameImage, nameTexture, gl.CLAMP_TO_EDGE);
    });
    nameImage.src = "name.png";
}

function getShader(id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

var shaderProgram;

function initShaders() {
    var fragmentShader = getShader("shader-fs");
    var vertexShader = getShader("shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "in_pos");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_tex_clouds"), 0);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_tex_name"), 1);
}

var fsqBuffer;

function initBuffers() {
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
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_time"), (currentTime - startTime)/1000.0);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_pageOffsetY"), window.pageYOffset);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_canvasHeight"), gl.viewportHeight);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_aspectRatio"), gl.viewportHeight/gl.viewportWidth);
    gl.bindBuffer(gl.ARRAY_BUFFER, fsqBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, fsqBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nameTexture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, fsqBuffer.numItems);
}

function main() {
    var canvas = document.getElementById("webglcanvas");
    try {
        gl = canvas.getContext("experimental-webgl");
        onResize();
        initTextures();
        initShaders();
        initBuffers();
    } catch (e) {
        alert(e);
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    startTime = (new Date).getTime();
    addEvent(window, "resize", onResize);
    (function animloop(){
        window.requestAnimationFrame(animloop);
        currentTime = (new Date).getTime();
        //Reset clock at 20 minutes
        if (currentTime - startTime > 1200000) startTime = currentTime;
        drawScene();
    })();
}