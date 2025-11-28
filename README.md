# DevCampus AI

DevCampus AI is a comprehensive educational platform powered by Artificial Intelligence, designed to enhance the learning and teaching experience. Built with modern web technologies, it offers a suite of tools for students and educators, including AI tutoring, live classrooms, and media creation studios.

## Features

*   **Dashboard**: A central hub for accessing all platform features and viewing key metrics.
*   **ChatTutor**: An intelligent AI-powered chat interface that acts as a personal tutor, helping students with their questions and studies.
*   **LiveClassroom**: A virtual classroom environment designed for real-time interaction and learning.
*   **MediaStudio**: A creative suite for producing and editing educational media content.
*   **Analyzer**: Advanced analytics tools to track performance and gain insights into learning progress.
*   **Authentication**: Secure user login and session management.

## Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google Gemini API (@google/genai)

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/programador077/devcampus-ai.git
    cd devcampus-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Google Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    *(Note: Ensure the variable name matches what is used in the code, typically `VITE_` prefix is required for Vite)*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the URL shown in your terminal).

## Project Structure

*   `src/components/`: Contains all the main application components (Dashboard, ChatTutor, etc.).
*   `src/services/`: API services and integrations (e.g., Gemini Service).
*   `src/App.tsx`: Main application component and routing logic.
*   `src/types.ts`: TypeScript type definitions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
