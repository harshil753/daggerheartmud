# PDF Splitter for Gemini LLM

## Overview
This folder contains a Python script to split the Daggerheart SRD PDF into optimally-sized chunks for ingestion by Google's Gemini LLM model.

## Script: `split_pdf_for_gemini.py`

### Purpose
Splits large PDF documents into smaller text files that fit within Gemini's 1 million token context window. The script is configured to target ~800k tokens per chunk to ensure safe ingestion.

### Features
- **Automatic token estimation**: Uses character-based token counting (1 token ≈ 4 characters)
- **Logical break detection**: Identifies chapters, sections, and major headings to split at natural boundaries
- **Progress reporting**: Shows detailed progress during PDF processing
- **Summary generation**: Creates a summary file with chunk overview
- **Formatted output**: Adds headers and footers to each chunk for context

### Usage

```bash
python supporting_functions/split_pdf_for_gemini.py
```

The script will:
1. Read the PDF from `docs/DH-SRD-May202025.pdf`
2. Extract all text and detect logical breaks
3. Split into chunks based on token limits
4. Save output files to `supporting_functions/Results/`

### Output Files

#### For the Daggerheart SRD:
- `00_SUMMARY.txt` - Overview of all chunks with page ranges and token counts
- `DH_SRD_Part_01_Pages_1-135.txt` - Complete rulebook text (135 pages, ~126,750 tokens)

**Note:** The Daggerheart SRD (135 pages) fits entirely within a single chunk, well under the 800k token limit. This means you can load the entire rulebook into Gemini's context in one go.

### Configuration

You can modify these constants in the script:

```python
TOKEN_LIMIT = 800000       # Conservative limit for chunk size
CHARS_PER_TOKEN = 4        # Token estimation ratio
```

### Dependencies

- `PyPDF2` - Automatically installed on first run

### Recommendations for AI Ingestion

1. **Single Context Load**: Load the entire document into Gemini's context for best results
2. **Gemini Model**: Use `gemini-2.5-flash` as specified in the project documentation
3. **Context Size**: The full SRD is ~126k tokens, leaving ~874k tokens for conversation/responses
4. **DM Prompt**: Use this text as the knowledge base for your Dungeon Master AI

### Technical Details

- **Token Estimation**: Conservative 4:1 character-to-token ratio
- **Section Detection**: Regex patterns identify chapter headings and major sections
- **Smart Splitting**: Attempts to split at logical boundaries when multiple chunks needed
- **Encoding**: UTF-8 output compatible with all modern systems

