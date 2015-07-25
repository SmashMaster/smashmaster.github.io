/* Author: Samuel Johnson (SmashMaster) */
/* Copyright: 2014 Samuel Johnson */
/* License: https://github.com/SmashMaster/smashmaster.github.io/blob/master/LICENSE */

precision lowp float;

uniform sampler2D u_tex_normals;
uniform vec3 u_sun_light_color;
uniform float u_sun_radius;
uniform float u_moon_radius;
uniform vec2 u_sun_pos;
uniform vec2 u_moon_pos;

varying vec2 v_pos;

#define AA_SIZE (1.0/12.0)
#define AA_THRESHOLD (1.0 - AA_SIZE)
#define PI_OVER_2 1.57079632679
#define TEX_SCALE 4.0
#define DISTORT_AMT 1.4

/**
 * Projects a sphere with the given radius and distance onto a unit sphere at
 * the origin, creating a spherical cap. Returns the angular radius of the cap,
 * as well as its surface area as a fraction of the total solid angle.
 */
void sphereCap(float radius, float distance, out float angularRadius, out float solidAngleFrac) {
    float apparentRadius = radius/distance;
    angularRadius = asin(apparentRadius);
    solidAngleFrac = 0.5 - sqrt(1.0 - apparentRadius)*0.5;
}

/**
 * Returns the great circle distance between two given vectors, projected onto
 * a unit sphere on the origin.
 */
float greatCircleDistance(vec3 a, vec3 b) {
    return atan(length(cross(a, b)), dot(a, b));
}

/**
 * Returns the overlap between two spherical caps, as a fraction of the total
 * solid angle. The caps are defined by their angular radii and their fractional
 * solid angles.
 */
float capOverlap(float ar0, float ar1, float fc0, float fc1, float gcd) {
    float arSum = ar0 + ar1;
    
    if (gcd > arSum) {
        return 0.0;
    }
    
    float arDif = abs(ar0 - ar1);
    float fcMin = min(fc0, fc1);
    
    if (gcd < arDif) {
        return fcMin;
    }
    
    //Approximate fractional overlap
    return fcMin*smoothstep(0.0, 1.0, 1.0 - (gcd - arDif)/(arSum - arDif));
}

//Calculate attenuation of direct light from the sun.
float sunAtten(vec3 p) {
    vec3 moonDir = vec3(u_moon_pos, 0.0) - p;
    vec3 sunDir = vec3(u_sun_pos, 0.0) - p;
    
    float moonAR, sunAR;
    float moonFC, sunFC;
    
    sphereCap(u_moon_radius, length(moonDir), moonAR, moonFC);
    sphereCap(u_sun_radius, length(sunDir), sunAR, sunFC);
    
    float attenuation = 1.0;
    
    //Compute occlusion due to solar eclipse
    float moonSunDistance = greatCircleDistance(moonDir, sunDir);
    float moonSunOverlap = capOverlap(moonAR, sunAR, moonFC, sunFC, moonSunDistance);
    attenuation *= clamp((sunFC - moonSunOverlap)/sunFC, 0.0, 1.0);
    
    //Compute occlusion due to horizon
    float selfSunDistance = greatCircleDistance(-p, sunDir);
    float selfSunOverlap = capOverlap(PI_OVER_2, sunAR, 0.5, sunFC, selfSunDistance);
    attenuation *= clamp((sunFC - selfSunOverlap)/sunFC, 0.0, 1.0);
    
    //Attenuation due to distance of sun
    attenuation *= sunFC;
    
    return attenuation;
}

//Calculate attenuation of indirect light, bouncing off of the moon.
float moonAtten(vec3 p) {
    float attenuation = 1.0;

    {//First we will consider the situation from the moon's perspective.
        vec3 planetDir = vec3(-u_moon_pos, 0.0);
        vec3 sunDir = planetDir + vec3(u_sun_pos, 0.0);
        vec3 hemiDir = planetDir + p;
        
        float planetAR, sunAR;
        float planetFC, sunFC;
        
        sphereCap(1.0, length(planetDir), planetAR, planetFC);
        sphereCap(u_sun_radius, length(sunDir), sunAR, sunFC);
        
        //Compute occlusion due to lunar eclipse
        //This could be moved outside of shader code.
        float planetSunDistance = greatCircleDistance(planetDir, sunDir);
        float planetSunOverlap = capOverlap(planetAR, sunAR, planetFC, sunFC, planetSunDistance);
        attenuation *= clamp((sunFC - planetSunOverlap)/sunFC, 0.0, 1.0);
        
        //Compute occlusion due to phase of moon
        float hemiSunDistance = greatCircleDistance(hemiDir, sunDir);
        float hemiSunOverlap = capOverlap(PI_OVER_2, PI_OVER_2, 0.5, 0.5, hemiSunDistance);
        attenuation *= hemiSunOverlap*2.0;
        
        //Attenuation due to distance of sun
        attenuation *= sunFC;
    }
    
    vec3 moonDir = vec3(u_moon_pos, 0.0) - p;
    float moonAR, moonFC;
    sphereCap(u_moon_radius, length(moonDir), moonAR, moonFC);
    
    //Attenuation due to distance of moon
    attenuation *= moonFC;
    
    //Finally, compute occlusion due to moon being on horizon
    float selfMoonDistance = greatCircleDistance(-p, moonDir);
    float selfMoonOverlap = capOverlap(PI_OVER_2, moonAR, 0.5, moonFC, selfMoonDistance);
    attenuation *= clamp((moonFC - selfMoonOverlap)/moonFC, 0.0, 1.0);
    
    return attenuation;
}

void main() {
    float rsq = v_pos.x*v_pos.x + v_pos.y*v_pos.y;
    if (rsq >= 1.0) {
        gl_FragColor = vec4(0.0);
    }
    else {
        vec2 uv = v_pos*0.5 + 0.5;
        uv.y = -uv.y;
        
        vec3 pos = vec3(v_pos, sqrt(1.0 - rsq));
        vec3 normal = normalize(texture2D(u_tex_normals, uv).xyz*2.0 - 1.0);
        
        vec3 sunLightDir = normalize(vec3(u_sun_pos - v_pos, 0.0));
        float sb = dot(sunLightDir, normal)*sunAtten(pos);
        vec3 sunColor = u_sun_light_color*sb;
        
        vec3 moonLightDir = normalize(vec3(u_moon_pos - v_pos, 0.0));
        float mb = dot(moonLightDir, normal)*moonAtten(pos);
        vec3 moonColor = u_sun_light_color*(4.0*mb);
        
        gl_FragColor = vec4(sunColor + moonColor, 1.0);
        
        float r = sqrt(rsq);
        
        if (r > AA_THRESHOLD) {
            gl_FragColor *= (1.0-r)/AA_SIZE;
        }
    }
}
