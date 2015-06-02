/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

varying vec2 v_pos;

const float AA_SIZE = 0.125;
const float AA_THRESHOLD = 1.0 - AA_SIZE;

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= 1.0) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r);
        gl_FragColor = vec4(v_pos.x*0.5 + 0.5, 0.0, v_pos.y*0.5 + 0.5, 1.0);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}