/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2016 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform float u_time;
uniform float u_aspect_ratio;

varying vec2 v_pos;

const int MAX_STEPS = 24;
const float INTERSECT_EPSILON = 1.0/128.0;
const vec3 CAMERA_POS = vec3(0.0, 0.0, 3.0);
const float FLOOR_Y = -2.0;
const vec3 LIGHT_DIR = normalize(vec3(-1.0, 1.0, 1.25));
const float SHADOW_HARDNESS = 32.0;

float dist_blob(vec3 pos) {
    float time = u_time;
    float ts = 1.111111;
    float scale = 1.0/2.0;
    mat3 mat = mat3(-0.8, 0.5, 1.5,
                    1.5, 0.8, -0.5,
                    0.5, -1.5, 0.8);
    
    float dist = length(pos) - 1.0;
    for (int i=0; i<8; i++)
    {
        dist += sin(pos.x + pos.y + pos.z + time)*scale;
        pos *= mat;
        time *= ts;
        scale *= 0.5;
    }

    return dist;
}

vec3 normal_blob(vec3 pos) {
	vec2 delta = vec2(0.001, 0.0);
	return normalize(vec3(dist_blob(pos + delta.xyy) - dist_blob(pos - delta.xyy),
                          dist_blob(pos + delta.yxy) - dist_blob(pos - delta.yxy),
                          dist_blob(pos + delta.yyx) - dist_blob(pos - delta.yyx)));
}

float shadow_blob(vec3 start) {
    float shadow = 1.0;
    float t = 0.0;
    for (int i=0; i<MAX_STEPS; i++) {
        float d = dist_blob(start + LIGHT_DIR*t);
        if (d < INTERSECT_EPSILON) return 0.0;
        shadow = min(shadow, SHADOW_HARDNESS*d/t);
        t += d;
    }
    return shadow;
}

vec3 frag_color() {
    vec3 ray = normalize(vec3(v_pos.x*u_aspect_ratio, v_pos.y, -1.0));
    
    float t = 0.0;
    for (int i=0; i<MAX_STEPS; i++) {
        vec3 p = CAMERA_POS + ray*t;
        float d = dist_blob(p);
        
        if (d < INTERSECT_EPSILON) {
            vec3 normal = normal_blob(p);
            vec3 reflected = reflect(ray, normal);
            return vec3(dot(reflected, LIGHT_DIR));
        }
        
        t += d;
    }
    
    float t_floor = (FLOOR_Y - CAMERA_POS.y)/ray.y;
    vec3 p_floor = CAMERA_POS + ray*t_floor;
    float shadow = shadow_blob(p_floor);
    return vec3(mix(0.5, 1.0, shadow));
}

void main() {
    gl_FragColor = vec4(frag_color(), 1.0);
}
