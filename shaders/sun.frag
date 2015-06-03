/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform float u_time;
uniform sampler2D u_texture;

varying vec2 v_pos;

const vec4 COLOR_A = vec4(0.4, 0.0, 0.0, 1.0);
const vec4 COLOR_B = vec4(2.0, 1.0, 0.3, 1.0);
const float SIZE = 1.0;
const float SIZE_SQ = SIZE*SIZE;
const float AA_SIZE = SIZE/64.0;
const float AA_THRESHOLD = 1.0 - AA_SIZE;
const float PERTURB_AMT = 0.75;
const float PERTURB_RATE = 1.0/64.0;
const float TEX_SCALE = 8.0;
const float DISTORT_AMT = 1.4;

vec2 perturb(vec2 uv, float t, float ofs, float amt) {
    vec2 dp = vec2(texture2D(u_texture, vec2(uv.x + ofs, uv.y + t)).r,
                   texture2D(u_texture, vec2(uv.x + t, uv.y + ofs)).r)*2.0 - 1.0;
    dp *= amt;
    return uv + dp;
}

vec2 megaPerturb(vec2 uv) {
    uv = perturb(uv, u_time*PERTURB_RATE, 0.66, PERTURB_AMT);
    uv = perturb(uv, -u_time*PERTURB_RATE, 0.33, -PERTURB_AMT);
    return uv;
}

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= SIZE_SQ) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r)/SIZE;
        vec2 uv = v_pos/(SIZE*TEX_SCALE*(DISTORT_AMT - r));
        float color_lerp = texture2D(u_texture, megaPerturb(uv)).r;
        gl_FragColor = mix(COLOR_A, COLOR_B, color_lerp);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}