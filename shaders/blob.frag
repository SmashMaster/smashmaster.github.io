/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2016 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform float u_time;

varying vec2 v_pos;

void main() {
    gl_FragColor = vec4(v_pos, 0.0, 1.0);
}
