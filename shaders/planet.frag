/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

varying vec2 v_pos;

const float AA_SIZE = 1.0/12.0;
const float AA_THRESHOLD = 1.0 - AA_SIZE;

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= 1.0) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r);
        gl_FragColor = vec4(1.0, 0.7, 0.9, 1.0);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}