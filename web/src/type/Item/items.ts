import speedPng from "../../assets/Item/Speed-Up.png";
import recoveryPng from "../../assets/Item/Recovery.png";
import teleportPng from "../../assets/Item/Teleport.png";

import visPng from "../../assets/Item/Visibility.png";
import bondagePng from "../../assets/Item/Bondage.png";
import keyPng from "../../assets/Item/Key.png";


export type ItemGrade = "S" | "B";

export type ItemId =
  // B 등급
  | "BALL"
  | "SPEED_UP"
  | "RECOVERY"
  | "TELEPORT"
  // S 등급
  | "STRIKE"
  | "VISIBILITY"
  | "BONDAGE"
  | "KEY";

export interface Item {
  id: ItemId;
  grade: ItemGrade;
  name: string;
  // 아이콘 텍스트(간단 표시). 필요하면 이미지 경로로 바꿔도 됨
  iconSrc?: string;
}

export const B_ITEMS: Item[] = [
    { id: "SPEED_UP", grade: "B", name: "Speed-Up",   iconSrc: speedPng },
    { id: "RECOVERY", grade: "B", name: "Recovery",   iconSrc: recoveryPng },
    { id: "TELEPORT", grade: "B", name: "Teleport",   iconSrc: teleportPng },
  ];
  
  export const S_ITEMS: Item[] = [
    { id: "VISIBILITY", grade: "S", name: "Visibility", iconSrc: visPng },
    { id: "BONDAGE",    grade: "S", name: "Bondage",    iconSrc: bondagePng },
    { id: "KEY",        grade: "S", name: "Key",        iconSrc: keyPng },
  ];

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
