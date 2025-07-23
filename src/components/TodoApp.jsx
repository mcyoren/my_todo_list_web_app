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
import { GripVertical, Trash2, Edit3, Check } from "lucide-react";

const JSONBLOB_IDS = {
  Masha: "1397236255732981760",
  Yura: "1397239646651604992",
  Shared: "1397637105034911744"
};

export default function TodoApp() {
  const [activeTab, setActiveTab] = useState("Masha");
  const [itemsByTab, setItemsByTab] = useState({ Masha: [], Yura: [], Shared: [] });
  const [loadedTabs, setLoadedTabs] = useState({ Masha: false, Yura: false, Shared: false });
  const [inputValue, setInputValue] = useState("");
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    if (loadedTabs[activeTab]) return;
    fetch(`https://jsonblob.com/api/jsonBlob/${JSONBLOB_IDS[activeTab]}`)
      .then(res => res.json())
      .then(data => {
        setItemsByTab(prev => ({ ...prev, [activeTab]: Array.isArray(data) ? data : [] }));
        setLoadedTabs(prev => ({ ...prev, [activeTab]: true }));
      })
      .catch(() => {});
  }, [activeTab, loadedTabs]);

  useEffect(() => {
    if (!loadedTabs[activeTab]) return;
    fetch(`https://jsonblob.com/api/jsonBlob/${JSONBLOB_IDS[activeTab]}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemsByTab[activeTab])
    }).catch(() => {});
  }, [itemsByTab, activeTab, loadedTabs]);

  function addItem() {
    if (!inputValue.trim()) return;
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: [
        ...prev[activeTab],
        { id: Date.now().toString(), text: inputValue, priority: priority, done: false, editing: false }
      ]
    }));
    setInputValue("");
    setPriority("normal");
  }

  function deleteItem(id) {
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(item => item.id !== id)
    }));
  }

  function toggleDone(id) {
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item => item.id === id ? { ...item, done: !item.done } : item)
    }));
  }

  function startEdit(id) {
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item => item.id === id ? { ...item, editing: true } : item)
    }));
  }

  function saveEdit(id, newText) {
    setItemsByTab(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item => item.id === id ? { ...item, text: newText, editing: false } : item)
    }));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = itemsByTab[activeTab].findIndex(i => i.id === active.id);
      const newIndex = itemsByTab[activeTab].findIndex(i => i.id === over.id);
      setItemsByTab(prev => ({
        ...prev,
        [activeTab]: arrayMove(prev[activeTab], oldIndex, newIndex)
      }));
    }
  }

  return (
    <main style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto", background: "#1e1e2f", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem", color: "#fefefe" }}>MY To-Do Lists</h1>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {Object.keys(JSONBLOB_IDS).map(name => (
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

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ borderRadius: "8px", padding: "0.3rem" }}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
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
        <SortableContext items={itemsByTab[activeTab]?.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {itemsByTab[activeTab]?.map(item => (
              <SortableItem key={item.id} item={item} onDelete={() => deleteItem(item.id)} onToggleDone={() => toggleDone(item.id)} onStartEdit={() => startEdit(item.id)} onSaveEdit={saveEdit} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </main>
  );
}

function SortableItem({ item, onDelete, onToggleDone, onStartEdit, onSaveEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const priorityColor = item.priority === "high" ? "#ff5555" : item.priority === "low" ? "#4caf50" : "#0070f3";

  return (
    <motion.li ref={setNodeRef} style={{ ...style, marginBottom: "0.5rem" }} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem",
          border: `2px solid ${priorityColor}`,
          borderRadius: "8px",
          background: item.done ? "#444" : "#2c2c3a",
          color: item.done ? "#999" : "#fefefe",
          textDecoration: item.done ? "line-through" : "none",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          <button {...attributes} {...listeners} style={{ background: "none", border: "none", cursor: "grab", color: "#aaa" }}>
            <GripVertical size={16} />
          </button>
          {item.editing ? (
            <input
              defaultValue={item.text}
              onKeyDown={(e) => { if (e.key === 'Enter') onSaveEdit(item.id, e.target.value); }}
              onBlur={(e) => onSaveEdit(item.id, e.target.value)}
              autoFocus
              style={{ flex: 1, background: "#222", color: "#fff", border: "1px solid #555", borderRadius: "4px" }}
            />
          ) : (
            <span onDoubleClick={onToggleDone} style={{ flex: 1, cursor: "pointer" }}>{item.text}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <button onClick={onStartEdit} style={{ background: "none", border: "none", color: "#ff0", cursor: "pointer" }}>
            <Edit3 size={16} />
          </button>
          <button onClick={onToggleDone} style={{ background: "none", border: "none", color: "#0f0", cursor: "pointer" }}>
            <Check size={16} />
          </button>
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ff5555", cursor: "pointer" }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.li>
  );
}
