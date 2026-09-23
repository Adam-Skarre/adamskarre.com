# Download generation

The website is static and does not need these authoring dependencies at runtime.

To regenerate the downloads in an authoring environment with Node.js, `@oai/artifact-tool`, Python and ReportLab installed:

1. Run `node tools/build-workbook.mjs`. This builds the eight-sheet Excel file, recalculates it, compares six scenario/plan combinations with the independent website engine, and writes supporting JSON under `outputs/pe-portfolio/`.
2. Run `python3 tools/build-memo.py`. It reads that verified JSON, builds the three-page memo under `output/pdf/`, and copies it to the website download directory.
3. Run `node --test finance/tests/model.test.mjs`. Review the workbook previews and render every PDF page before publishing.

The checked-in downloads are the default case. Browser controls affect the live analysis and CSV exports, not the static Excel and PDF files.
