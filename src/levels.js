import { P } from './patterns.js';

/* ---------- campaign levels: pure data, easy to move into JSON or ScriptableObjects ---------- */
export const LEVELS=[
  { name:'Training grounds', seed:11, start:[16,0,0], par:260, build(){
    P.section('Crowd build'); P.run(26); P.gates('+15','x2'); P.run(6); P.gates('+10','-8'); P.gates('x2','+15'); P.barrels(3); P.gates('+30','/2'); P.run(8); P.cp();
    P.section('Hazard course'); P.saws(2,1.1); P.run(6); P.funnel(3.2); P.run(6); P.pend(2,1.4); P.gates('x2','+20'); P.jump(4); P.run(6); P.crumble(22,6.5); P.run(6); P.cp();
    P.section('Branching paths'); P.branch(['x3'],['+20']); P.run(8); P.wall(170); P.run(4); P.gates('+40','x2'); P.run(6); P.cp();
    P.section('Final assault'); P.fortress(700,4); P.boss(4200,1); } },
  { name:'Sawmill pass', seed:22, start:[14,0,0], par:520, build(){
    P.section('Crowd build'); P.run(26); P.gates('+10','+5'); P.gates('x2','-10'); P.barrels(4); P.gates('+15','x2'); P.run(6); P.funnel(3); P.gates('x3','+30'); P.cp();
    P.section('Hazard course'); P.saws(3,1.3); P.pend(2,1.7); P.jump(4.5); P.run(6); P.crumble(28,5.5); P.barrels(4); P.wall(280); P.run(4); P.gates('+20','-15'); P.cp();
    P.section('The sawmill'); P.saws(2,1.7); P.funnel(2.8); P.pend(3,1.8); P.gates('x2','/2'); P.jump(5); P.run(6); P.cp();
    P.section('Branching paths'); P.branch(['x2','x3'],['+20','+10'],80,true); P.run(8); P.wall(420); P.run(4); P.gates('x2','+40'); P.cp();
    P.section('Final assault'); P.fortress(2400,6); P.boss(18000,2); } },
  { name:'The iron keep', seed:33, start:[20,0,0], par:900, build(){
    P.section('Crowd build'); P.run(26); P.gates('+15','x2'); P.gates('-10','+10'); P.barrels(4); P.gates('x2','+20'); P.funnel(3.4); P.gates('+30','x3'); P.wall(200); P.cp();
    P.section('Hazard course'); P.saws(3,1.5); P.jump(5); P.pend(3,1.9); P.run(4); P.crumble(30,5); P.gates('/2','+25'); P.barrels(5); P.funnel(2.6); P.cp();
    P.section('Gauntlet'); P.saws(4,1.8); P.gates('x2','-30'); P.jump(5.5); P.pend(2,2.1); P.wall(350); P.crumble(26,4.5); P.run(6); P.cp();
    P.section('Branching paths'); P.branch(['x3','x2'],['+30','+20'],80,true); P.run(6); P.branch(['x4'],['+40'],60,true); P.wall(700); P.gates('x2','+60'); P.cp();
    P.section('Final assault'); P.fortress(5200,8); P.boss(40000,3); } },
];
