/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2016 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

attribute vec2 in_pos;

varying vec2 v_pos;

void main(void) {
    v_pos = in_pos;
    gl_Position = vec4(in_pos, 0.0, 1.0);
}
