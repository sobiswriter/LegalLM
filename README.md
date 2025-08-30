# LegalLM: Your AI-Powered Legal Document Analysis Workspace

LegalLM is an advanced, AI-driven application designed to streamline the process of legal document analysis. It provides a secure, intuitive workspace where legal professionals can upload documents, receive intelligent summaries, identify risks, and ask complex questions in natural language.

![LegalLM Screenshot](https://storage.googleapis.com/studioprototype.appspot.com/legallm-screenshot.png)

## Features

- **Multi-Format Document Upload**: Seamlessly upload and process documents in various formats, including `.txt`, `.pdf`, and `.docx`.
- **AI-Powered Summarization**: Instantly generate concise, structured summaries of your legal documents. The AI identifies key components such as parties, term length, key obligations, and potential risks.
- **Interactive Q&A**: Engage in a conversation with your documents. Ask specific questions and get clear, context-aware answers from the AI.
- **Risk & Clause Analysis**: Proactively identify potential legal risks, important obligations, and other critical clauses within your documents.
- **Legal Jargon Definition**: Get plain-language definitions for complex legal terms, explained within the specific context of your document.
- **Source-Cited Analysis**: Every piece of information provided by the AI is backed by a citation. Clicking a citation instantly highlights the exact source text in the document viewer, ensuring transparency and trust.
- **Modern & Responsive UI**: A clean, modern, and fully responsive user interface built for an efficient and pleasant user experience.

## Tech Stack

LegalLM is built with a modern, type-safe, and performant technology stack:

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI & GenAI**: [Genkit](https://firebase.google.com/docs/genkit) (powered by Google's Gemini family of models)
- **UI Components**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **File Parsing**: [pdf2json](https://www.npmjs.com/package/pdf2json), [Mammoth](https://www.npmjs.com/package/mammoth) for `.docx` files.
- **Deployment**: Ready for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## Getting Started

Follow these instructions to get a local copy of LegalLM up and running.

### Prerequisites

- [Node.js](https://nodejs.org/en) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of your project and add your Google AI API key. You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    ```env
    GEMINI_API_KEY=your_google_ai_api_key_here
    ```

4.  **Run the Genkit development server:**
    In a separate terminal, start the Genkit development server. This runs the AI flows that power the application.
    ```bash
    npm run genkit:watch
    ```
    This will start the Genkit server, typically on port 3400, and watch for any changes in your AI flow files.

5.  **Run the Next.js development server:**
    In your main terminal, start the Next.js application.
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

You should now have a fully functional local instance of LegalLM running!
