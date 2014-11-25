precision lowp float;

uniform float u_time;
uniform float u_canvasHeight;
uniform float u_pageOffsetY;
uniform float u_aspectRatio;
uniform sampler2D u_tex_clouds;
uniform sampler2D u_tex_name;

varying vec2 v_pos;

const float CAMERA_HEIGHT = 0.125;
const float Z_CLIP_NEAR = 0.0625;
const float ATMOSPHERIC_DENSITY = 0.05;
const vec3 ATMOSPHERIC_ATTENUATION = vec3(0.06, 0.09, 0.1);
const vec3 ATMOSPHERIC_INSCATTERING = vec3(0.06, 0.09, 0.1);

float intersectPlaneY(vec3 rayPos, vec3 rayDir, float planeY) {
    return (planeY - rayPos.y)/rayDir.y;
}

float intersectPlaneZ(vec3 rayPos, vec3 rayDir, float planeZ) {
    return (planeZ - rayPos.z)/rayDir.z;
}

void atmAttenuate(in float opticalDepth, inout vec3 luminance) {
    vec3 t = exp(-opticalDepth*ATMOSPHERIC_DENSITY*ATMOSPHERIC_ATTENUATION);
    luminance = mix(ATMOSPHERIC_INSCATTERING, luminance, t);
}

/*NAME*/

const float NAME_DISTANCE = 1.0;
const float NAME_SCALE = 0.125;
const float NAME_HEIGHT = 0.07;
const float NAME_ASPECT_RATIO = 4.0;
const float NAME_Y_FACTOR = NAME_HEIGHT/NAME_ASPECT_RATIO;
const vec3 NAME_COLOR = vec3(0.875);

vec3 rayName(vec3 rayPos, vec3 rayDir, float prevT) {
    float t = intersectPlaneZ(rayPos, rayDir, -NAME_DISTANCE);
    
    if (t < 0.0 || t > prevT) {
        return vec3(0.0);
    }
    
    vec3 p = rayPos + rayDir*t;
    vec2 tc = vec2(p.x/NAME_ASPECT_RATIO, NAME_HEIGHT-p.y);
    tc = (tc/NAME_SCALE)*0.5 + 0.5;
    
    if (tc.x < 0.0 || tc.x > 1.0 || tc.y < 0.0 || tc.y > 1.0) return vec3(0.0);
    
    return NAME_COLOR*texture2D(u_tex_name, tc).r;
}

/*AURORA*/

const float AURORA_HEIGHT = 48.0;
const float AURORA_SCALE = 512.0;
const float AURORA_DISTORT_SCALE = 2048.0;
const float AURORA_DISTORT_AMOUNT = 2.0;
const float AURORA_BRIGHTNESS = 2.5;
const vec3 AURORA_COLOR_A = vec3(0.0, 0.9, 0.1);
const vec3 AURORA_COLOR_B = vec3(0.0, 0.4, 0.6);
const vec3 AURORA_AVERAGE_COLOR = (AURORA_COLOR_A + AURORA_COLOR_B)*(0.5*AURORA_BRIGHTNESS);
const float AURORA_FADE_START = 100.0;
const float AURORA_FADE_END = 750.0;
const float AURORA_FADE_DIST = AURORA_FADE_END - AURORA_FADE_START;

float auroraDensity(vec3 pos) {
    float t = u_time/64.0;
    vec2 p = vec2(pos.x, pos.z);
    
    vec2 dp = p/AURORA_DISTORT_SCALE;
    float dt = t/16.0;
    vec2 d = vec2(
        texture2D(u_tex_clouds, vec2(dp.x + dt,  dp.y + 0.5)).r, 0.0);
    d = (d*2.0 - 1.0)*AURORA_DISTORT_AMOUNT;
    
    float b = texture2D(u_tex_clouds, p/AURORA_SCALE - t + d).r;
    
    return pow(b, 24.0);
}

vec3 auroraColor(vec3 pos) {
    pos.xz /= 256.0;
    
    vec2 texCoord = vec2(pos.x + u_time/32.0, pos.z);
    float ct = texture2D(u_tex_clouds, texCoord).r;
    return mix(AURORA_COLOR_A, AURORA_COLOR_B, ct*ct);
}

vec3 rayAurora(vec3 rayPos, vec3 rayDir) {
    float t = intersectPlaneY(rayPos, rayDir, AURORA_HEIGHT);
    vec3 p = rayPos + rayDir*t;
    float fadeT = clamp((t - AURORA_FADE_START)/AURORA_FADE_DIST, 0.0, 1.0);
    
    vec3 luminance = vec3(0.0);
    
    if (fadeT < 1.0) {
        luminance += ((1.0 - fadeT)*AURORA_BRIGHTNESS*auroraDensity(p))*auroraColor(p);
    }
    if (fadeT > 0.0) {
        luminance += AURORA_AVERAGE_COLOR*(fadeT*0.175);
    }
    
    atmAttenuate(t, luminance);
    luminance += rayName(rayPos, rayDir, t);
    return luminance;
}

/*WATER*/

const float WATER_DEPTH = 1.0/64.0;
const float WATER_FADE_START = 0.35;
const float WATER_FADE_END = 0.025;
const float WATER_FADE_DIST = WATER_FADE_START - WATER_FADE_END;
const vec3 WATER_FAR_COLOR = ATMOSPHERIC_INSCATTERING;
const float WATER_ETA = 1.05;

const float WATER_DENSITY = 60.0;
const vec3 WATER_ATTENUATION = vec3(0.05, 0.05, 0.05);
const vec3 WATER_INSCATTERING = vec3(0.05, 0.05, 0.05);

float waterHeight(vec3 pos) {
    float t = u_time/48.0;
    
    pos.x += -1.5*t;
    pos.z += 0.5*t;

    return (texture2D(u_tex_clouds, vec2(pos.x + t, pos.z      )).r +
            texture2D(u_tex_clouds, vec2(pos.x - t, pos.z + 0.5)).r +
            texture2D(u_tex_clouds, vec2(pos.x,       pos.z + t)).r +
            texture2D(u_tex_clouds, vec2(pos.x + 0.5, pos.z - t)).r)*0.25;
}

vec3 waterNormal(vec3 pos) {
    const float D = 1.0/512.0;
    
    float h = waterHeight(pos);
    float hx = waterHeight(vec3(pos.x + D, pos.y, pos.z));
    float hz = waterHeight(vec3(pos.x, pos.y, pos.z + D));
    
    const float F = WATER_DEPTH/D;
    
    return normalize(vec3((h - hx)*F, 1.0, (h - hz)*F));
}

vec3 rayWaterTop(vec3 rayPos, vec3 rayDir)
{
    float t = intersectPlaneY(rayPos, rayDir, 0.0);
    vec3 p = rayPos + t*rayDir;
    
    if (p.z > -Z_CLIP_NEAR) return WATER_INSCATTERING;
    
    const vec3 WATER_BASE_NORMAL = vec3(0.0, 1.0, 0.0);
    vec3 baseReflect = reflect(rayDir, WATER_BASE_NORMAL);
    float fadeT = clamp((WATER_FADE_START - baseReflect.y)/WATER_FADE_DIST, 0.0, 1.0);
    
    vec3 luminance = vec3(0.0);
    
    if (fadeT < 1.0) {
        vec3 n = waterNormal(p);
        vec3 ref = reflect(rayDir, n);
        
        if (ref.y > 0.0) {
            luminance += (1.0 - fadeT)*rayAurora(p, ref);
        }
    }
    if (fadeT > 0.0) {
        luminance += fadeT*WATER_FAR_COLOR;
    }
    
    atmAttenuate(t, luminance);
    luminance += rayName(rayPos, rayDir, t);
    return luminance;
}

void watAttenuate(in float opticalDepth, inout vec3 luminance) {
    vec3 t = exp(-opticalDepth*WATER_DENSITY*WATER_ATTENUATION);
    luminance = mix(WATER_INSCATTERING, luminance, t);
}

vec3 rayWaterBottom(vec3 rayPos, vec3 rayDir)
{
    float t = intersectPlaneY(rayPos, rayDir, 0.0);
    vec3 p = rayPos + t*rayDir;
    
    if (p.z > -Z_CLIP_NEAR) return rayAurora(rayPos, rayDir);
    
    vec3 ref = refract(rayDir, -waterNormal(p), WATER_ETA);
    if (ref == vec3(0.0)) {
        return WATER_INSCATTERING; //Total internal reflection
    } else {
        vec3 luminance = rayAurora(p, ref);
        watAttenuate(t, luminance);
        return luminance;
    }
}

/*MAIN*/

vec3 ray(vec3 rayPos, vec3 rayDir) {
    if (rayPos.y < 0.0) {
        if (rayDir.y > 0.0) {
            return rayWaterBottom(rayPos, rayDir);
        } else {
            return WATER_INSCATTERING;
        }
    } else {
        if (rayDir.y > 0.0) {
            return rayAurora(rayPos, rayDir);
        } else {
            return rayWaterTop(rayPos, rayDir);
        }
    }
}

void main() {
    //Cull offscreen pixels
    float camOffset = u_pageOffsetY/400.0;
    
    //Set up view ray
    vec3 camPos = vec3(0.0, CAMERA_HEIGHT*(1.0 - camOffset), 0.0);
    vec3 rayDir = normalize(vec3(v_pos.x/u_aspectRatio, v_pos.y, -1.0));
    
    vec3 color = ray(camPos, rayDir);
    
    gl_FragColor = vec4(color, 1.0);
}