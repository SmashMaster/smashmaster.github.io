/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform float u_time;
uniform sampler2D u_texture;

varying vec2 v_pos;

const float AA_SIZE = 1.0/64.0;
const float AA_THRESHOLD = 1.0 - AA_SIZE;

float dynamicNoise(vec2 p, float t) {
    return (texture2D(u_texture, vec2(p.x + t,   p.y      )).r +
            texture2D(u_texture, vec2(p.x - t,   p.y + 0.5)).r +
            texture2D(u_texture, vec2(p.x,       p.y + t)).r +
            texture2D(u_texture, vec2(p.x + 0.5, p.y - t)).r)*0.25;
}

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= 1.0) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r);
        vec2 uv = v_pos*(0.5/(1.125 - r));
        uv.x += u_time;
        gl_FragColor = texture2D(u_texture, uv);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}