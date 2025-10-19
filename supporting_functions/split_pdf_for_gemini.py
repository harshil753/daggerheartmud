"""
PDF Splitter for Gemini LLM
Splits a large PDF into smaller chunks optimized for Gemini's 1M token context window.
Targets ~800k tokens per file to ensure safe ingestion.
"""

import os
import sys
import re
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    print("PyPDF2 not found. Installing required packages...")
    os.system("pip install PyPDF2")
    import PyPDF2

# Configuration
TOKEN_LIMIT = 800000  # Conservative limit (Gemini supports 1M, but we use 800k for safety)
CHARS_PER_TOKEN = 4   # Rough estimation: 1 token ≈ 4 characters

# Paths
SCRIPT_DIR = Path(__file__).parent
PDF_PATH = SCRIPT_DIR.parent / "docs" / "ilide.info-daggerheart-core-rulebook-5-20-2025-1-pr_a93e201ebeaefc111985c42fd3b09258.pdf"
OUTPUT_DIR = SCRIPT_DIR / "Results"

def estimate_tokens(text):
    """Estimate token count based on character count."""
    return len(text) // CHARS_PER_TOKEN

def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF with page numbers."""
    print(f"Reading PDF: {pdf_path}")
    
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        total_pages = len(reader.pages)
        print(f"Total pages: {total_pages}")
        
        pages_data = []
        total_chars = 0
        
        for page_num in range(total_pages):
            page = reader.pages[page_num]
            text = page.extract_text()
            chars = len(text)
            total_chars += chars
            
            pages_data.append({
                'page_num': page_num + 1,
                'text': text,
                'chars': chars,
                'tokens': estimate_tokens(text)
            })
            
            if (page_num + 1) % 10 == 0:
                print(f"  Processed {page_num + 1}/{total_pages} pages...")
        
        print(f"\nTotal characters extracted: {total_chars:,}")
        print(f"Estimated total tokens: {estimate_tokens(str(total_chars)):,}")
        
        return pages_data, total_pages

def detect_logical_breaks(pages_data):
    """
    Detect logical breaks in the document (chapters, sections).
    Returns list of page numbers where major breaks occur.
    """
    breaks = [0]  # Always start at page 0
    
    # Common patterns for chapter/section headers
    chapter_patterns = [
        r'^CHAPTER\s+\d+',
        r'^Chapter\s+\d+',
        r'^\d+\.\s+[A-Z][A-Z\s]{5,}',  # Numbered sections with caps
        r'^[A-Z][A-Z\s]{10,}$',  # All caps headings
    ]
    
    for i, page in enumerate(pages_data):
        # Check first few lines for chapter/section markers
        lines = page['text'].split('\n')[:5]
        for line in lines:
            line = line.strip()
            if line:
                for pattern in chapter_patterns:
                    if re.match(pattern, line):
                        print(f"  Found section break at page {page['page_num']}: {line[:50]}")
                        if i > 0:  # Don't add break at first page
                            breaks.append(i)
                        break
    
    return sorted(set(breaks))

def split_by_tokens(pages_data, logical_breaks):
    """
    Split pages into chunks based on token limits and logical breaks.
    """
    chunks = []
    current_chunk = []
    current_tokens = 0
    current_start_page = 1
    
    print(f"\nSplitting content (target: {TOKEN_LIMIT:,} tokens per chunk)...")
    
    for i, page in enumerate(pages_data):
        page_tokens = page['tokens']
        
        # Check if adding this page would exceed limit
        if current_tokens + page_tokens > TOKEN_LIMIT and current_chunk:
            # Save current chunk
            chunk_text = '\n\n'.join([p['text'] for p in current_chunk])
            chunks.append({
                'text': chunk_text,
                'start_page': current_start_page,
                'end_page': current_chunk[-1]['page_num'],
                'tokens': current_tokens,
                'pages': len(current_chunk)
            })
            
            print(f"  Chunk {len(chunks)}: Pages {current_start_page}-{current_chunk[-1]['page_num']} "
                  f"({len(current_chunk)} pages, ~{current_tokens:,} tokens)")
            
            # Start new chunk
            current_chunk = [page]
            current_tokens = page_tokens
            current_start_page = page['page_num']
        else:
            # Add page to current chunk
            current_chunk.append(page)
            current_tokens += page_tokens
    
    # Don't forget the last chunk
    if current_chunk:
        chunk_text = '\n\n'.join([p['text'] for p in current_chunk])
        chunks.append({
            'text': chunk_text,
            'start_page': current_start_page,
            'end_page': current_chunk[-1]['page_num'],
            'tokens': current_tokens,
            'pages': len(current_chunk)
        })
        
        print(f"  Chunk {len(chunks)}: Pages {current_start_page}-{current_chunk[-1]['page_num']} "
              f"({len(current_chunk)} pages, ~{current_tokens:,} tokens)")
    
    return chunks

def save_chunks(chunks, output_dir):
    """Save chunks to separate files."""
    # Create output directory if it doesn't exist
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\nSaving {len(chunks)} chunks to: {output_dir}")
    
    # Create a summary file
    summary_path = output_dir / "00_SUMMARY.txt"
    with open(summary_path, 'w', encoding='utf-8') as f:
        f.write("DAGGERHEART SRD - SPLIT FOR GEMINI LLM\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Total chunks: {len(chunks)}\n")
        f.write(f"Token limit per chunk: {TOKEN_LIMIT:,}\n\n")
        f.write("Chunk Overview:\n")
        f.write("-" * 60 + "\n")
        
        for i, chunk in enumerate(chunks, 1):
            filename = f"DH_SRD_Part_{i:02d}_Pages_{chunk['start_page']}-{chunk['end_page']}.txt"
            f.write(f"\nPart {i}: {filename}\n")
            f.write(f"  Pages: {chunk['start_page']}-{chunk['end_page']} ({chunk['pages']} pages)\n")
            f.write(f"  Tokens: ~{chunk['tokens']:,}\n")
    
    print(f"  Created: {summary_path.name}")
    
    # Save each chunk
    for i, chunk in enumerate(chunks, 1):
        filename = f"DH_SRD_Part_{i:02d}_Pages_{chunk['start_page']}-{chunk['end_page']}.txt"
        filepath = output_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            # Add header
            f.write("=" * 70 + "\n")
            f.write(f"DAGGERHEART SYSTEM REFERENCE DOCUMENT (SRD)\n")
            f.write(f"Part {i} of {len(chunks)}\n")
            f.write(f"Pages: {chunk['start_page']}-{chunk['end_page']}\n")
            f.write("=" * 70 + "\n\n")
            
            # Add content
            f.write(chunk['text'])
            
            # Add footer
            f.write("\n\n" + "=" * 70 + "\n")
            f.write(f"End of Part {i} | Pages {chunk['start_page']}-{chunk['end_page']}\n")
            f.write("=" * 70 + "\n")
        
        print(f"  Created: {filename}")
    
    print(f"\n[SUCCESS] Created {len(chunks) + 1} files in {output_dir}")
    print(f"\n[RECOMMENDATION FOR AI INGESTION]:")
    print(f"   Load all {len(chunks)} parts into Gemini's context sequentially.")
    print(f"   Each part is under {TOKEN_LIMIT:,} tokens, well within the 1M limit.")
    print(f"   For best results, use Gemini's long-context capabilities to load")
    print(f"   all parts together, giving the AI complete rulebook knowledge.")

def main():
    """Main execution function."""
    print("=" * 70)
    print("DAGGERHEART SRD PDF SPLITTER FOR GEMINI")
    print("=" * 70)
    print()
    
    # Check if PDF exists
    if not PDF_PATH.exists():
        print(f"[ERROR] PDF not found at {PDF_PATH}")
        print(f"   Please ensure the PDF is located in the docs folder.")
        sys.exit(1)
    
    # Extract text from PDF
    pages_data, total_pages = extract_text_from_pdf(PDF_PATH)
    
    # Detect logical breaks (chapters/sections)
    print("\nDetecting logical breaks (chapters/sections)...")
    logical_breaks = detect_logical_breaks(pages_data)
    print(f"  Found {len(logical_breaks)} potential section breaks")
    
    # Split by tokens with respect to logical breaks
    chunks = split_by_tokens(pages_data, logical_breaks)
    
    # Save chunks
    save_chunks(chunks, OUTPUT_DIR)
    
    # Final summary
    total_tokens = sum(chunk['tokens'] for chunk in chunks)
    print(f"\n[FINAL SUMMARY]:")
    print(f"   Total pages processed: {total_pages}")
    print(f"   Total chunks created: {len(chunks)}")
    print(f"   Average tokens per chunk: ~{total_tokens // len(chunks):,}")
    print(f"   Total estimated tokens: ~{total_tokens:,}")
    print(f"\n[COMPLETE] Ready for Gemini AI ingestion!")

if __name__ == "__main__":
    main()

