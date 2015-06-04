/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform vec2 u_sun_pos;
uniform vec2 u_planet_pos;

varying vec2 v_pos;

const float AA_SIZE = 1.0/8.0;
const float AA_THRESHOLD = 1.0 - AA_SIZE;

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (r >= 1.0) {
        gl_FragColor = vec4(0.0);
    }
    else {
        r = sqrt(r);
        
        vec3 normal = vec3(v_pos, sqrt(1.0 - r));
        vec3 lightDir = normalize(vec3(u_sun_pos - v_pos, 0.0));
        float b = dot(normal, lightDir);
        
        gl_FragColor = vec4(vec3(b), 1.0);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}