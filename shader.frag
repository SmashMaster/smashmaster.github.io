/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

varying vec2 v_pos;

void main() {
    gl_FragColor = vec4(v_pos.x*0.5 + 0.5, 0.0, v_pos.y*0.5 + 0.5, 1.0);
}