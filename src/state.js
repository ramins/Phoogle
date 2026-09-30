import { store } from './util.js';
import { CFG } from './config.js';

/* Shared mutable game state. Kept in objects so every module sees the same values. */
export const T={};
export const C={ x:0,z:0,vz:0,speed:9,n:[0,0,0],units:[[],[],[]],fallers:[[],[],[]],jumpT:null,jumpFront:0,jumpVz:9,air:2*CFG.jumpV/CFG.gravity,
  front:0,back:0,radius:1,compress:1,engaged:null,hpDebt:0,mergeT:0,volleyT:0,funnelSeg:-1,funnelTier:-1,popMode:'hit',spawnOX:0,spawnOZ:0,prevZ:0,maxY:0,mergePop:0,steerVis:0 };
export const G={state:'boot',time:0,stateT:0,mode:'campaign',level:0,cp:null,shake:0,endlessBest:store.get('endlessBest',0),progress:store.get('progress',{unlocked:1,stars:[0,0,0]}),section:'',peakHP:0,startTime:0,hintShown:{}};
export const input={l:false,r:false,up:false,down:false,sprint:false,drag:0,padSteer:0,padSpeed:0};
