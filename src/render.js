import * as THREE from 'three';
import { $, DARK, IS_TOUCH } from './util.js';

/* ================= renderer / scene ================= */
export const canvas=$('#c');
export const renderer=new THREE.WebGLRenderer({canvas, antialias:!IS_TOUCH, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, IS_TOUCH?1.5:2));
export const scene=new THREE.Scene();
const SKY=new THREE.Color(DARK?0x5e8196:0xa9cfe0);
scene.background=SKY; scene.fog=new THREE.Fog(SKY, 75, 175);
export const camera=new THREE.PerspectiveCamera(55,1,.1,500);
scene.add(new THREE.HemisphereLight(0xf1f7ff, 0x6b5a45, DARK?0.62:0.7));
export const sun=new THREE.DirectionalLight(0xfff6e8, DARK?0.5:0.6); sun.position.set(-20,40,-12); scene.add(sun);
export const voidMesh=new THREE.Mesh(new THREE.PlaneGeometry(900,900), new THREE.MeshBasicMaterial({color:DARK?0x3e5a6c:0x7fa6bd}));
voidMesh.rotation.x=-Math.PI/2; voidMesh.position.y=-38; scene.add(voidMesh);
function resize(){ const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.fov = w<h?72:55; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
