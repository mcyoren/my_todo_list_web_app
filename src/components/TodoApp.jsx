// src/components/TodoApp.jsx
"use client";

import { useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";

const JSONBLOB_IDS = {
  Masha: "1397236255732981760",
  Yura: "1397239646651604992"
};

export default function TodoApp() {
  const [itemsByTab, setItemsByTab] = useState({ Masha: [], Yura: [] });
  const [activeTab, setActiveTab] = useState("Masha");
  const [inputValue, setInputValue] = useState("");

  // Load when tab changes
  useEffect(() => {
    fetch(`https://jsonblob.com/api/jsonBlob/${JSONBLOB_IDS[activeTab]}`)
      .then(res => res.json())
      .then(data => {
        setItemsByTab(prev => ({ ...prev, [activeTab]: Array.isArray(data) ? data : [] }));
      });
  }, [activeTab]);

  // Save only that tab’s items when they change
  useEffect(() => {
    fetch(`https://jsonblob.com/api/jsonBlob/${JSONBLOB_IDS[activeTab]}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemsByTab[activeTab] || [])
    });
  }, [itemsByTab[activeTab], activeTab]);

  // Helper for adding
  function addItem() {
    if (!inputValue.trim()) return;
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], { id: Date.now().toString(), text: inputValue }]
    }));
    setInputValue("");
  }

  function deleteItem(id) {
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(item => item.id !== id)
    }));
  }


  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <main style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto", background: "#1e1e2f", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem", color: "#fefefe" }}>MY To-Do Lists</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {Object.keys(JSONBLOB_IDS).map((name) => (
          <button
            key={name}
            onClick={() => setActiveTab(name)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === name ? "#0070f3" : "#444",
              color: "white",
              fontWeight: "bold"
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <h2 style={{ color: "#ccc", marginBottom: "0.5rem" }}>{activeTab}'s To-Do List</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          style={{ flex: 1, padding: "0.5rem", border: "2px solid #444", borderRadius: "8px", backgroundColor: "#2c2c3a", color: "#fefefe" }}
          placeholder="Add a new task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
        />
        <button
          style={{ padding: "0.5rem 1rem", backgroundColor: "#4caf50", color: "white", fontWeight: "bold", border: "none", borderRadius: "8px", cursor: "pointer" }}
          onClick={addItem}
        >
          Add
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemsByTab[activeTab].map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {itemsByTab[activeTab]?.map(item => (
              <SortableItem key={item.id} id={item.id} text={item.text} onDelete={() => deleteItem(item.id)} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </main>
  );
}

function SortableItem({ id, text, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <motion.li
      ref={setNodeRef}
      style={{ ...style, marginBottom: "0.5rem" }}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem",
          border: "1px solid #555",
          borderRadius: "8px",
          background: "#2c2c3a",
          color: "#fefefe",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button {...attributes} {...listeners} style={{ background: "none", border: "none", cursor: "grab", color: "#aaa" }}>
            <GripVertical size={16} />
          </button>
          <span>{text}</span>
        </div>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ff5555", cursor: "pointer" }}>
          <Trash2 size={16} />
        </button>
      </div>
    </motion.li>
  );
}
