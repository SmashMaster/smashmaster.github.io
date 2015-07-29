/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform sampler2D u_texture;
uniform vec3 u_sun_light_color;
uniform float u_size_factor;
uniform float u_time;

varying vec2 v_pos;

const vec3 COLOR_A = vec3(0.5, 0.08, 0.04);
const vec3 COLOR_B = vec3(1.5);

const float SUN_PERTURB_AMT = 0.75;
const float SUN_PERTURB_RATE = 1.0/64.0;
const float SUN_TEX_SCALE = 8.0;
const float SUN_DISTORT_AMT = 1.4;
const float SUN_AA_SIZE = 1.0/128.0;

const float CORONA_RPOW = 0.0625;
const float CORONA_SPEED = 1.0/4.0;
const float CORONA_ASCALE = 1.0/8.0;
const float CORONA_RSCALE = 1.0/8.0;
const float CORONA_Z_START = 0.25;
const float CORONA_DEPTH = 1.0 - CORONA_Z_START;
const float CORONA_ALPHA = 0.6;

vec2 perturb(vec2 uv, float t, float ofs, float amt) {
    vec2 dp = vec2(texture2D(u_texture, vec2(uv.x + ofs, uv.y + t)).r,
                   texture2D(u_texture, vec2(uv.x + t, uv.y + ofs)).r)*2.0 - 1.0;
    dp *= amt;
    return uv + dp;
}

vec2 megaPerturb(vec2 uv) {
    uv = perturb(uv, u_time*SUN_PERTURB_RATE, 0.66, SUN_PERTURB_AMT);
    uv = perturb(uv, -u_time*SUN_PERTURB_RATE, 0.33, -SUN_PERTURB_AMT);
    return uv;
}

float sqAtan2(vec2 v) {
    v /= max(abs(v.x), abs(v.y));
    
    if (v.x >= 0.0) {
        if (v.y >= 0.0) return -v.x + v.y + 1.0; //(+, +)
        else            return  v.x + v.y + 7.0; //(+, -)
    }
    else {
        if (v.y >= 0.0) return -v.x - v.y + 3.0; //(-, +)
        else            return  v.x - v.y + 5.0; //(-, -)
    }
}

void alphaBlend(inout vec4 destination, vec3 color, float alpha) {
    destination *= 1.0 - alpha;
    destination.rgb += color*alpha;
    destination.a += alpha;
}

void main() {
    float r = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    gl_FragColor = vec4(0.0);
    
    if (r < 1.0) {
        float z = 1.0;
    
        if (r < u_size_factor*u_size_factor) {
            float sr = sqrt(r)/u_size_factor;
            z = 1.0 - sqrt(1.0 - sr);
            z = (z - CORONA_Z_START)/CORONA_DEPTH;
            
            vec2 uv = v_pos/(u_size_factor*SUN_TEX_SCALE*(SUN_DISTORT_AMT - sr));
            float color_lerp = texture2D(u_texture, megaPerturb(uv)).r;
            float a = 1.0;
            float aaSize = SUN_AA_SIZE/u_size_factor;
            if (sr > 1.0 - aaSize) a = (1.0-sr)/aaSize;
            
            alphaBlend(gl_FragColor, mix(COLOR_A, COLOR_B, color_lerp), a);
        }
        
        float a = sqAtan2(v_pos);
        vec2 uv = vec2(a, pow(r, CORONA_RPOW) - u_time*CORONA_SPEED);
        uv.x *= CORONA_ASCALE;
        uv.y *= CORONA_RSCALE;
        
        float zm = 1.0 - r;
        z *= zm*zm*CORONA_ALPHA*texture2D(u_texture, uv).r;
        z = clamp(z, 0.0, 1.0);
        alphaBlend(gl_FragColor, COLOR_B, z);
        
        gl_FragColor.rgb *= u_sun_light_color;
    }
}
