// src/component/UI/ItemSlots.tsx
import { useEffect, useState } from "react";
import "./ItemSlots.css";
import unselectedSlot from "../../assets/item_slot_unselected.png";
import selectedSlot from "../../assets/item_slot_selected.png";
import type { Item } from "../../type/Item/items";

type Props = {
  items: Item[]; // 길이 0~3
};

const ItemSlots = ({ items }: Props) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") {
        setSelectedSlotIndex(0);
        e.preventDefault();
      } else if (e.key === "2") {
        setSelectedSlotIndex(1);
        e.preventDefault();
      } else if (e.key === "3") {
        setSelectedSlotIndex(2);
        e.preventDefault();
      } else if (e.key === "e" || e.key === "E") {
        // E키로 아이템 사용
        window.dispatchEvent(new CustomEvent("use-item", {
          detail: { slotIndex: selectedSlotIndex }
        }));
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSlotIndex]);

  return (
    <div className="item-slots-container">
      {[0, 1, 2].map((index) => {
        const hasItem = index < items.length;
        const item = hasItem ? items[index] : null;
        return (
          <div
            key={index}
            className="item-slot"
            onClick={() => setSelectedSlotIndex(index)}
            title={item ? `${item.name} (${item.grade})` : "빈 슬롯"}
          >
            <img
              src={index === selectedSlotIndex ? selectedSlot : unselectedSlot}
              alt={`Slot ${index + 1}`}
              className="slot-image"
            />
            {/* 아이템 라벨/아이콘 오버레이 */}
            {item && (
              <div className={`slot-item-label ${item.grade === "S" ? "grade-s" : "grade-b"}`}>
                {item.iconSrc && (
                  <img className="slot-item-icon" src={item.iconSrc} alt={item.name} />
                )}
                {/* 텍스트도 같이 보이고 싶으면 아래 라인 유지, 아니면 삭제 */}
                {/* <span className="label">{item.name}</span> */}
              </div>
            )}
            <div className="slot-number">{index + 1}</div>
          </div>
        );
      })}
    </div>
  );
};

export default ItemSlots;
