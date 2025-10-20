# Leak Removal Script

The `leak_remover.py` script uses gitleaks to detect secrets and provides options to remove them from your git repository.

## Features

- **Leak Detection**: Uses gitleaks to scan for secrets in your repository
- **Export Options**: Exports leaks to both JSON and CSV formats
- **Git Filter-Repo Integration**: Can remove leaks from git history using git filter-repo
- **File-Based Removal**: Remove entire files containing leaks using `--invert-paths`
- **Content-Based Removal**: Remove leak content while preserving files
- **Manual Removal**: Creates scripts for manual leak removal from specific files
- **Comprehensive Logging**: Detailed logging of all operations

## Usage

### Basic Scan (Recommended First Step)
```bash
python supporting_functions/leak_remover.py --scan-only --export-csv
```

This will:
- Run gitleaks to detect secrets
- Export results to CSV format
- Create a manual removal script
- **NOT** modify your git history

### File-Based Removal (DANGEROUS - Removes Entire Files)
```bash
python supporting_functions/leak_remover.py --export-csv --remove-leak-files
```

This removes entire files containing leaks from git history using `git filter-repo --invert-paths`.

### Content-Based Removal (DANGEROUS - Rewrites Git History)
```bash
python supporting_functions/leak_remover.py --export-csv --run-filter-repo
```

This removes leak content while preserving files using content filtering.

⚠️ **WARNING**: Both options will rewrite your git history! Make sure you have backups and coordinate with your team.

### Options

- `--repo-path`: Path to git repository (default: current directory)
- `--output-dir`: Output directory for reports (default: leak_reports)
- `--export-csv`: Export leaks to CSV format
- `--run-filter-repo`: Remove leak content from history (DANGEROUS!)
- `--remove-leak-files`: Remove entire files containing leaks (DANGEROUS!)
- `--auto-confirm`: Skip confirmation prompts (use with caution)
- `--scan-only`: Only scan for leaks, do not remove

## Output Files

The script creates several files in the output directory:

1. **gitleaks_report.json**: Raw gitleaks output
2. **leaks.csv**: Formatted leak data for analysis
3. **manual_leak_removal.py**: Script for manual file cleanup
4. **remove_leak_files.sh**: Script to remove entire files from git history
5. **leak_remover.log**: Detailed operation log

## Manual Removal

### Content-Based Manual Removal
If you prefer to manually remove leak content from files:

```bash
python leak_reports/manual_leak_removal.py
```

### File-Based Manual Removal
To remove entire files containing leaks from git history:

```bash
# On Unix/Linux/macOS
bash leak_reports/remove_leak_files.sh

# On Windows (if you have bash)
bash leak_reports/remove_leak_files.sh
```

## Prerequisites

- **gitleaks**: Must be installed or have `gitleaks.exe` in repository root
- **git filter-repo**: Install with `pip install git-filter-repo` (for history rewriting)
- **Python 3.6+**

## Safety Recommendations

1. **Always backup your repository** before running with `--run-filter-repo`
2. **Start with `--scan-only`** to understand what leaks exist
3. **Coordinate with your team** before rewriting git history
4. **Test on a copy** of your repository first

## Example Workflow

1. **Initial Scan**:
   ```bash
   python supporting_functions/leak_remover.py --scan-only --export-csv
   ```

2. **Review Results**:
   - Check `leak_reports/leaks.csv` for detected secrets
   - Review `leak_reports/leak_remover.log` for details

3. **Manual Cleanup** (if needed):
   ```bash
   python leak_reports/manual_leak_removal.py
   ```

4. **File-Based History Cleanup** (if necessary):
   ```bash
   python supporting_functions/leak_remover.py --export-csv --remove-leak-files
   ```

5. **Content-Based History Cleanup** (alternative):
   ```bash
   python supporting_functions/leak_remover.py --export-csv --run-filter-repo
   ```

## Detected Leak Types

The script can detect and remove:
- JWT tokens
- Private keys (RSA, EC, etc.)
- API keys
- Other secrets detected by gitleaks

## Troubleshooting

- **"Not a git repository"**: Run from the repository root directory
- **"gitleaks not found"**: Install gitleaks or ensure `gitleaks.exe` is in the repo root
- **"git filter-repo not installed"**: Install with `pip install git-filter-repo`
