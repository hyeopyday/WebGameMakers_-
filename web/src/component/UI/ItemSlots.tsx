// web/src/component/UI/ItemSlots.tsx
import { useEffect, useState } from "react";
import "./ItemSlots.css";
import unselectedSlot from "../../assets/item_slot_unselected.png";
import selectedSlot from "../../assets/item_slot_selected.png";

const ItemSlots = () => {
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
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="item-slot"
          onClick={() => setSelectedSlotIndex(index)}
        >
          <img 
            src={index === selectedSlotIndex ? selectedSlot : unselectedSlot}
            alt={`Slot ${index + 1}`}
            className="slot-image"
          />
          <div className="slot-number">{index + 1}</div>
        </div>
      ))}
    </div>
  );
};

export default ItemSlots;