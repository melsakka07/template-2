# Business Case Generator

A Next.js application that generates comprehensive business case reports through AI-powered chat interactions. Users can provide project details and financial metrics, then collaborate with AI to create professional reports with visualizations and export capabilities.

## Features

- **Structured Data Collection**
  - Multi-step form for project details
  - Financial metrics input (TCO, CAPEX, OPEX)
  - Customer projections (Initial Count, Growth %, ARPU)
  - Form validation using Zod

- **AI-Powered Report Generation**
  - OpenAI GPT-4 integration
  - Comprehensive report sections
  - Financial projections and analysis

- **Dynamic Report Preview**
  - Real-time HTML report preview
  - Interactive financial tables
  - Professional formatting

- **Export Options**
  - DOCX export with proper formatting
  - PDF export with layout preservation
  - Clean, professional output

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React, Shadcn/ui, Tailwind CSS
- **Form Handling**: React Hook Form, Zod
- **AI Integration**: OpenAI API
- **Document Generation**: docx, pdf-lib
- **Styling**: Tailwind CSS

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd business-case-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-report/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── BusinessCaseForm.tsx
│   ├── ReportPreview.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── tabs.tsx
└── lib/
    └── export/
        ├── docxConverter.ts
        └── pdfConverter.ts
```

## Usage

1. Fill in the basic project information (name, company, country, industry).
2. Enter financial metrics (TCO, CAPEX, OPEX).
3. Provide customer projections.
4. Generate the report using AI.
5. Preview the generated report.
6. Export to DOCX or PDF format.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.