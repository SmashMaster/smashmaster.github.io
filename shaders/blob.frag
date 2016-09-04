/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2016 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision mediump float;

uniform samplerCube u_cubemap;

uniform float u_time;
uniform float u_aspect_ratio;

varying vec2 v_pos;

const int MAX_STEPS = 24;
const float INTERSECT_EPSILON = 1.0/256.0;
const vec3 CAMERA_POS = vec3(0.0, 0.0, 2.0);
const float FLOOR_Y = -2.0;
const vec3 LIGHT_DIR = normalize(vec3(-1.0, 1.0, 1.25));
const float SHADOW_HARDNESS = 16.0;
const float FRESNEL_R0 = 0.03;
const float HIGHLIGHT_BRIGHTNESS = 0.75;

float dist_sphere(vec3 pos, float scale) {
    if (scale > 3.5) return -64.0;
    scale *= 0.675;
    return length(pos) - scale;
}

float dist_tetra(vec3 pos, float scale) {
    if (scale > 3.5) return -64.0;
    scale *= 0.25;
    float dist = dot(pos, vec3(0.0, -1.0, 0.0)) - scale;
    dist = max(dist, dot(pos, vec3(0.81650615, 0.33330014, 0.47141153)) - scale);
    dist = max(dist, dot(pos, vec3(0.0, 0.3333083, -0.9428179)) - scale);
    return max(dist, dot(pos, vec3(-0.8164967, 0.3333078, 0.47142237)) - scale);
}

float dist_hexa(vec3 pos, float scale) {
    if (scale > 3.5) return -64.0;
    scale *= 0.5;
    return length(max(abs(pos) - scale, 0.0));
}

float dist_octa(vec3 pos, float scale) {
    if (scale > 3.5) return -64.0;
    scale *= 0.5773445;
    float dist = dot(pos, vec3(-0.5773503, -0.5773503, -0.5773503)) - scale;
    dist = max(dist, dot(pos, vec3(-0.5773503, -0.5773503, 0.5773503)) - scale);
    dist = max(dist, dot(pos, vec3(-0.5773503, 0.5773503, -0.5773503)) - scale);
    dist = max(dist, dot(pos, vec3(-0.5773503, 0.5773503, 0.5773503)) - scale);
    dist = max(dist, dot(pos, vec3(0.5773503, -0.5773503, -0.5773503)) - scale);
    dist = max(dist, dot(pos, vec3(0.5773503, -0.5773503, 0.5773503)) - scale);
    dist = max(dist, dot(pos, vec3(0.5773503, 0.5773503, -0.5773503)) - scale);
    return max(dist, dot(pos, vec3(0.5773503, 0.5773503, 0.5773503)) - scale);
}

float dist_dodeca(vec3 pos, float scale) {
    if (scale > 3.5) return -64.0;
    scale *= 0.6317063;
    float dist = dot(pos, vec3(0.0, 0.0, 1.0)) - scale;
    dist = max(dist, dot(pos, vec3(0.27639428, -0.8506485, 0.44721735)) - scale);
    dist = max(dist, dot(pos, vec3(0.8944272, 0.0, 0.4472136)) - scale);
    dist = max(dist, dot(pos, vec3(0.27639428, 0.8506485, 0.44721735)) - scale);
    dist = max(dist, dot(pos, vec3(-0.72360134, 0.5257274, 0.44722682)) - scale);
    dist = max(dist, dot(pos, vec3(-0.72360134, -0.5257274, 0.44722682)) - scale);
    dist = max(dist, dot(pos, vec3(0.0, 0.0, -1.0)) - scale);
    dist = max(dist, dot(pos, vec3(0.72360134, 0.5257274, -0.44722682)) - scale);
    dist = max(dist, dot(pos, vec3(0.72360134, -0.5257274, -0.44722682)) - scale);
    dist = max(dist, dot(pos, vec3(-0.27639428, -0.8506485, -0.44721735)) - scale);
    dist = max(dist, dot(pos, vec3(-0.8944272, 0.0, -0.4472136)) - scale);
    return max(dist, dot(pos, vec3(-0.27639428, 0.8506485, -0.44721735)) - scale);
}

float dist_icosa(vec3 pos, float scale) {
    if (scale > 3.5) return -64.0;
    scale *= 0.5;
    float dist = dot(pos, vec3(0.14907, -0.45879, -0.63148)) - scale;
    dist = max(dist, dot(pos, vec3(-0.39027, -0.28355, -0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(-0.39027, 0.28355, -0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(0.14907, 0.45879, -0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(0.4824, 0.0, -0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(-0.63147, -0.45879, -0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(-0.63147, 0.45879, -0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(0.2412, 0.74233, -0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(0.78054, 0.0, -0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(0.2412, -0.74234, -0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(-0.14907, -0.45879, 0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(0.39027, -0.28355, 0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(0.39027, 0.28355, 0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(-0.14907, 0.45879, 0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(-0.4824, 0.0, 0.63148)) - scale);
    dist = max(dist, dot(pos, vec3(0.63147, -0.45879, 0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(0.63147, 0.45879, 0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(-0.2412, 0.74233, 0.14907)) - scale);
    dist = max(dist, dot(pos, vec3(-0.78054, 0.0, 0.14907)) - scale);
    return max(dist, dot(pos, vec3(-0.2412, -0.74234, 0.14907)) - scale);
}

vec3 rotate(vec3 v, vec3 k, float a) {
    float c = cos(a);
    float s = sin(a);
    return v*c + cross(k, v)*s + k*dot(k, v)*(1.0 - c);
}

float linstep(float edge0, float edge1, float x) {
    return clamp((x - edge0)/(edge1 - edge0), 0.0, 1.0);
}

float phase_scale(float t, float t0) {
    float phase = mod(t - t0, 6.0);
    float lerp = linstep(1.0, 1.75, phase)*(1.0 - linstep(5.25, 6.0, phase));
    return mix(1.0, 4.0, lerp);
}

float dist_blob(vec3 pos) {
    pos = rotate(pos, vec3(0.0, 1.0, 0.0), u_time*0.5);
    float t = u_time*0.5 + 6.0;
    float dist = dist_sphere(pos, phase_scale(t, 0.0));
    dist = max(dist, dist_tetra(pos, phase_scale(t, 1.0)));
    dist = max(dist, dist_hexa(pos, phase_scale(t, 2.0)));
    dist = max(dist, dist_octa(pos, phase_scale(t, 3.0)));
    dist = max(dist, dist_dodeca(pos, phase_scale(t, 4.0)));
    return max(dist, dist_icosa(pos, phase_scale(t, 5.0)));
}

vec3 normal_blob(vec3 pos) {
	vec2 delta = vec2(0.005, 0.0);
	return normalize(vec3(dist_blob(pos - delta.xyy) - dist_blob(pos + delta.xyy),
                          dist_blob(pos - delta.yxy) - dist_blob(pos + delta.yxy),
                          dist_blob(pos - delta.yyx) - dist_blob(pos + delta.yyx)));
}

float shadow_blob(vec3 start) {
    float shadow = 1.0;
    float t = 0.0;
    for (int i=0; i<MAX_STEPS; i++) {
        float d = dist_blob(start + LIGHT_DIR*t);
        if (d < INTERSECT_EPSILON) return 0.0;
        shadow = min(shadow, SHADOW_HARDNESS*d/t);
        t += d;
        if (t > 6.0) break;
    }
    return shadow;
}

vec3 frag_color() {
    vec3 ray = normalize(vec3(v_pos.x*u_aspect_ratio, v_pos.y, -1.0));

    if (ray.z < -0.85) {
        float t = 0.0;
        for (int i=0; i<MAX_STEPS; i++) {
            vec3 p = CAMERA_POS + ray*t;
            float d = dist_blob(p);

            if (d < INTERSECT_EPSILON) {
                vec3 normal = normal_blob(p);
                float rdn = dot(ray, normal);
                if (rdn < 0.0) break;

                vec3 reflected = reflect(ray, normal);
                float fresnel = FRESNEL_R0 + (1.0 - FRESNEL_R0)*pow(clamp(1.0 - rdn, 0.0, 1.0), 2.0);
                float highlight = max(dot(reflected, LIGHT_DIR), 0.0);
                return textureCube(u_cubemap, reflected).rgb*fresnel + highlight*HIGHLIGHT_BRIGHTNESS;
            }

            t += d;
            if (t > 3.0) break;
        }
    }

    if (ray.y < -0.125 && ray.x > -0.25) {
        float t_floor = (FLOOR_Y - CAMERA_POS.y)/ray.y;
        vec3 p_floor = CAMERA_POS + ray*t_floor;
        float shadow = shadow_blob(p_floor);
        return vec3(mix(0.5, 1.0, shadow));
    }

    return vec3(1.0);
}

void main() {
    gl_FragColor = vec4(frag_color(), 1.0);
}
