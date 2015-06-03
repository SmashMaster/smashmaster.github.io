/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform float u_time;
uniform sampler2D u_texture;

varying vec2 v_pos;

const vec4 COLOR = vec4(1.3, 1.0, 0.3, 1.0);
const float SIZE = 0.5;
const float SIZE_SQ = SIZE*SIZE;
const float AA_SIZE = SIZE/64.0;
const float AA_THRESHOLD = 1.0 - AA_SIZE;
const float PERTURB_AMT = 0.25;
const float PERTURB_RATE = 1.0/32.0;
const float DISTORT_AMT = 1.25;
const float TEX_SCALE = 0.5;

vec2 perturb(vec2 uv, float t, float amt) {
    vec2 dp = vec2(texture2D(u_texture, vec2(uv.x + 0.5, uv.y + t)).r,
                   texture2D(u_texture, vec2(uv.x + t, uv.y + 0.5)).r)*2.0 - 1.0;
    dp *= amt;
    return uv + dp;
}

vec2 megaPerturb(vec2 uv) {
    uv = perturb(uv, u_time*PERTURB_RATE, PERTURB_AMT);
    uv = perturb(uv, u_time*PERTURB_RATE, -PERTURB_AMT);
    return uv;
}

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= SIZE_SQ) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r)/SIZE;
        vec2 uv = v_pos*(TEX_SCALE/(DISTORT_AMT - r))/SIZE;
        gl_FragColor = texture2D(u_texture, megaPerturb(uv))*COLOR;
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}