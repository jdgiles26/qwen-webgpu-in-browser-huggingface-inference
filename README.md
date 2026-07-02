# Qwen WebGPU In-Browser Inference ⚡

A high-performance, modern web application designed to run Large Language Models (LLMs) like **LFM2.5-1.2B-Thinking** entirely on the client side. By leveraging the WebGPU API, this project enables direct, hardware-accelerated AI inference inside the browser without requiring external server compute.

---

## ✨ Key Features

* **100% Local In-Browser Inference:** Privacy-first design. All computation happens directly on your machine's GPU via WebGPU.
* **Hugging Face Integration:** Seamlessly fetches and executes ONNX-optimized models from the Hugging Face Hub.
* **Ollama Mode Supported:** Includes a polished production mode designed to interface with Ollama for flexible local model management.
* **Frictionless Experience:** No password logins or complex backend setups required to test the inference engine.
* **Modern 2026 Tech Stack:** Built with blazing-fast **Vite**, strict **TypeScript**, and optimized for production deployments.

---

## 📦 Supported Models

This repository is currently configured for the following models via Hugging Face:

* [`LiquidAI/LFM2.5-1.2B-Thinking`](https://www.google.com/search?q=%5Bhttps://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking%5D(https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking))
* [`LiquidAI/LFM2.5-1.2B-Thinking-ONNX`](https://www.google.com/search?q=%5Bhttps://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking-ONNX%5D(https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking-ONNX)) (Optimized for WebGPU execution)

> **Note:** Performance will scale linearly with your device's GPU capabilities. A dedicated GPU is highly recommended for optimal token generation speeds.

---

## 🚀 Getting Started

### Prerequisites

To run this application, you must use a modern browser that fully supports the **WebGPU API**:

* Chrome 113+ / Edge 113+ (or equivalent Chromium-based browsers)
* Node.js (v18+ recommended)
* npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/jdgiles26/qwen-webgpu-in-browser-huggingface-inference.git
cd qwen-webgpu-in-browser-huggingface-inference

```


2. **Install dependencies:**
```bash
npm install
# or
yarn install

```


3. **Start the development server:**
```bash
npm run dev
# or
yarn dev

```


4. **Build for production:**
```bash
npm run build

```


The compiled output will be generated in the `dist/` directory, ready to be served statically.

---

## 🛠 Project Structure

| Directory/File | Description |
| --- | --- |
| `src/` | Core application logic, React/TypeScript components, and WebGPU bindings. |
| `public/` | Static assets and demo files. |
| `dist/` | Production build output containing the static `index.html`. |
| `vite.config.ts` | Configuration for the Vite build tool. |
| `eslint.config.js` | Strict linting rules to maintain code quality. |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/jdgiles26/qwen-webgpu-in-browser-huggingface-inference/issues) if you want to contribute.

## 📄 License

This project is configured as public by `jdgiles26`. Please review the repository files for specific licensing details regarding the inference code and model usage policies dictated by LiquidAI/Hugging Face.
