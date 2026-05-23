# ⚡ KINETIX

**A Zero-Touch, Intent-Driven Spatial Computing Interface.**

[![Status](https://img.shields.io/badge/Status-Active_Development-10B981?style=for-the-badge)]()
[![Ecosystem](https://img.shields.io/badge/Architecture-Unified_Monorepo-20B2AA?style=for-the-badge)]()
[![AI](https://img.shields.io/badge/AI_Engine-VLM_Orchestration-7FFFD4?style=for-the-badge)]()

Kinetix breaks artificial intelligence out of the text box and gives it a physical presence in the real world. By translating raw human physical movement into digital action, Kinetix removes the barrier of traditional peripherals (mice, keyboards) and creates a hands-free, context-aware automation pipeline.

This project is a core module within a broader unified monorepo ecosystem, engineered to bridge the gap between low-level system tracking (hardware/OS manipulation) and high-level AI/GenAI (vision-language reasoning).

---

## 🎯 The Vision

Right now, humans must translate their intentions into keystrokes. Kinetix reverses this paradigm. Whether it is a surgeon in a sterile operating room needing to scroll through X-rays, an industrial worker with grease-covered hands reviewing schematics, or a user with motor impairments navigating the web—Kinetix makes the computer understand *you*.

## ✨ Core Features

* **Real-Time Spatial Perception:** Utilizes edge-based computer vision (MediaPipe) to instantly map skeletal joints of the hands, face, or body through any standard webcam.
* **Dynamic Gesture Mapping (Modes):** A highly fluid Next.js frontend that allows users to instantly remap physical gestures to digital actions via context bundles (e.g., *Browser Mode*, *Media Mode*, *Doctor Mode*, *Terminal Mode*).
* **VLM Orchestration Engine:** Integrates Vision-Language Models (VLMs) to understand screen context. Point at a paragraph and trigger a gesture, and the AI agent will read the screen coordinates and execute complex workflows (like summarizing text).
* **Zero-Latency Execution:** A deterministic Python/FastAPI backend calculates physical vectors (velocity, pinch distance) and fires system-level execution commands (via `pyautogui`, `pymouse`, etc.) via WebSockets.

---

## 🏗️ Architecture Pipeline

The system operates on a continuous loop of Perception, Reasoning, and Execution:

1.  **👁️ Perception (The Eyes):** OpenCV + MediaPipe captures physical movement.
2.  **⚙️ Math Engine (The Backend):** Python calculates the physics of the movement (velocity for swipes, distance for pinches, vectors for pointing).
3.  **🧠 Orchestrator (The Brain):** LangChain + VLM (GPT-4o/Claude) interprets complex visual queries based on screen context.
4.  **🦾 Execution (The Hands):** System-level scripts automatically move the cursor, scroll pages, or type text.

---

## 💻 Technology Stack

* **Frontend Interface:** Next.js, React, Tailwind CSS, Framer Motion *(Bioluminescent / Hacker-Architect aesthetic)*
* **Backend API & WebSockets:** Python, FastAPI, Uvicorn
* **Computer Vision:** OpenCV, Google MediaPipe
* **System Automation:** PyAutoGUI, keyboard

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* Standard Webcam

### Installation (Monorepo Setup)

**1. Clone the repository:**
```bash
git clone [https://github.com/susovanchatterjee/kinetix.git](https://github.com/susovanchatterjee/kinetix.git)
cd kinetix
