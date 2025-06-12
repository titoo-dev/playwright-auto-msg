const fs = require('fs');
const path = require('path');

/**
 * CSV to JSON Converter
 * Converts CSV files to JSON format with configurable options
 */
class CSVToJSONConverter {
    constructor(options = {}) {
        this.delimiter = options.delimiter || ',';
        this.encoding = options.encoding || 'utf8';
        this.skipEmptyLines = options.skipEmptyLines !== false;
        this.trimValues = options.trimValues !== false;
    }

    /**
     * Parse CSV content to JSON array
     * @param {string} csvContent - CSV file content
     * @returns {Array} Array of objects representing CSV rows
     */
    parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        const result = [];
        
        if (lines.length === 0) {
            throw new Error('CSV content is empty');
        }

        // Get headers from first line
        const headers = this.parseLine(lines[0]);
        if (headers.length === 0) {
            throw new Error('No headers found in CSV');
        }

        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            if (this.skipEmptyLines && !line.trim()) {
                continue;
            }

            const values = this.parseLine(line);
            if (values.length === 0) continue;

            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            
            result.push(obj);
        }

        return result;
    }

    /**
     * Parse a single CSV line handling quoted values
     * @param {string} line - CSV line to parse
     * @returns {Array} Array of parsed values
     */
    parseLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === this.delimiter && !inQuotes) {
                result.push(this.trimValues ? current.trim() : current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(this.trimValues ? current.trim() : current);
        return result;
    }

    /**
     * Convert CSV file to JSON and save to file
     * @param {string} csvFilePath - Path to input CSV file
     * @param {string} jsonFilePath - Path to output JSON file (optional)
     * @returns {Promise<Object>} Conversion result with data and file paths
     */
    async convertFile(csvFilePath, jsonFilePath = null) {
        try {
            console.log(`📖 Reading CSV file: ${csvFilePath}`);
            
            // Check if CSV file exists
            if (!fs.existsSync(csvFilePath)) {
                throw new Error(`CSV file not found: ${csvFilePath}`);
            }

            // Read CSV content
            const csvContent = fs.readFileSync(csvFilePath, this.encoding);
            
            // Parse CSV to JSON
            const jsonData = this.parseCSV(csvContent);
            console.log(`✅ Parsed ${jsonData.length} records from CSV`);

            // Generate output file path if not provided
            if (!jsonFilePath) {
                const dir = path.dirname(csvFilePath);
                const basename = path.basename(csvFilePath, '.csv');
                jsonFilePath = path.join(dir, `${basename}.json`);
            }

            // Write JSON file
            const jsonString = JSON.stringify(jsonData, null, 2);
            fs.writeFileSync(jsonFilePath, jsonString, this.encoding);
            
            console.log(`💾 JSON file saved: ${jsonFilePath}`);

            return {
                success: true,
                inputFile: csvFilePath,
                outputFile: jsonFilePath,
                recordCount: jsonData.length,
                data: jsonData
            };

        } catch (error) {
            console.error(`❌ Error converting CSV to JSON: ${error.message}`);
            return {
                success: false,
                error: error.message,
                inputFile: csvFilePath,
                outputFile: jsonFilePath
            };
        }
    }

    /**
     * Convert CSV content directly to JSON string
     * @param {string} csvContent - CSV content string
     * @returns {string} JSON string
     */
    convertContent(csvContent) {
        const jsonData = this.parseCSV(csvContent);
        return JSON.stringify(jsonData, null, 2);
    }
}

/**
 * Utility function to convert CSV file to JSON
 * @param {string} csvFilePath - Path to CSV file
 * @param {string} jsonFilePath - Optional output JSON file path
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Conversion result
 */
async function csvToJson(csvFilePath, jsonFilePath = null, options = {}) {
    const converter = new CSVToJSONConverter(options);
    return await converter.convertFile(csvFilePath, jsonFilePath);
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
📬 CSV to JSON Converter

Usage:
  node csv_to_json.js <input.csv> [output.json]

Examples:
  node csv_to_json.js data.csv
  node csv_to_json.js data.csv output.json
  node csv_to_json.js users.csv --delimiter=';'

Options:
  --delimiter=<char>    Field delimiter (default: ',')
  --encoding=<enc>      File encoding (default: 'utf8')
  --no-trim            Don't trim whitespace from values
  --include-empty      Include empty lines in processing
        `);
        process.exit(1);
    }

    const csvFile = args[0];
    const jsonFile = args[1];
    
    // Parse command line options
    const options = {};
    args.forEach(arg => {
        if (arg.startsWith('--delimiter=')) {
            options.delimiter = arg.split('=')[1];
        } else if (arg.startsWith('--encoding=')) {
            options.encoding = arg.split('=')[1];
        } else if (arg === '--no-trim') {
            options.trimValues = false;
        } else if (arg === '--include-empty') {
            options.skipEmptyLines = false;
        }
    });

    // Convert file
    csvToJson(csvFile, jsonFile, options)
        .then(result => {
            if (result.success) {
                console.log(`🎉 Successfully converted ${result.recordCount} records`);
                console.log(`📂 Output: ${result.outputFile}`);
            } else {
                console.error(`💥 Conversion failed: ${result.error}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error(`💥 Unexpected error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = {
    CSVToJSONConverter,
    csvToJson
};
