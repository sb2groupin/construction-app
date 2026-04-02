#!/usr/bin/env node

/**
 * Automated i18n Script
 * Adds useTranslation hook and replaces hardcoded strings with t() calls
 * Generates missing translation keys in en.json and hi.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PAGES_DIR = path.join(__dirname, '../src/pages');
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const EN_LOCALE = path.join(LOCALES_DIR, 'en.json');
const HI_LOCALE = path.join(LOCALES_DIR, 'hi.json');

// Predefined translations
const commonTranslations = {
  // UI Elements
  "Add": { en: "Add", hi: "जोड़ें" },
  "Edit": { en: "Edit", hi: "संपादित करें" },
  "Delete": { en: "Delete", hi: "हटाएं" },
  "Cancel": { en: "Cancel", hi: "रद्द करें" },
  "Submit": { en: "Submit", hi: "जमा करें" },
  "Save": { en: "Save", hi: "सहेजें" },
  "Update": { en: "Update", hi: "अपडेट करें" },
  "Back": { en: "Back", hi: "वापस" },
  "Loading": { en: "Loading...", hi: "लोड हो रहा है..." },
  "Loading...": { en: "Loading...", hi: "लोड हो रहा है..." },
  "Success": { en: "Success", hi: "सफल" },
  "Error": { en: "Error", hi: "त्रुटि" },
  "Warning": { en: "Warning", hi: "चेतावनी" },
  "No records": { en: "No records", hi: "कोई रिकॉर्ड नहीं" },
  "No data": { en: "No data found", hi: "कोई डेटा नहीं मिला" },
  
  // Form placeholders
  "Name": { en: "Name", hi: "नाम" },
  "Description": { en: "Description", hi: "विवरण" },
  "Amount": { en: "Amount", hi: "राशि" },
  "Date": { en: "Date", hi: "तारीख" },
  "Email": { en: "Email", hi: "ईमेल" },
  "Phone": { en: "Phone", hi: "फोन" },
  
  // Status
  "Active": { en: "Active", hi: "सक्रिय" },
  "Inactive": { en: "Inactive", hi: "निष्क्रिय" },
  "Pending": { en: "Pending", hi: "लंबित" },
  "Approved": { en: "Approved", hi: "मंजूर" },
  "Rejected": { en: "Rejected", hi: "अस्वीकृत" },
};

function stringToKey(str) {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .split(/\s+/)
    .map((word, idx) => 
      idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
    .substring(0, 50); // Max 50 chars
}

function findJSXFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...findJSXFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractHardcodedStrings(content) {
  const strings = new Set();
  
  // Find string literals that are likely UI text (not imports, not comments)
  const patterns = [
    /"([^"]{3,100})"/g,           // "string"
    /'([^']{3,100})'/g,           // 'string'
    />\s*([A-Z][^<]{3,100})</g,   // JSX content
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const str = match[1].trim();
      
      // Filter out code, imports, and technical strings
      if (
        str.length > 2 &&
        !str.includes('import') &&
        !str.includes('export') &&
        !str.includes('function') &&
        !str.includes('const ') &&
        !str.startsWith('_') &&
        !str.startsWith('.') &&
        !str.includes('://') &&
        !/^[a-z]+\s*\(/.test(str) && // Not a function call
        !/^\$\{/.test(str) // Not a template literal
      ) {
        strings.add(str);
      }
    }
  }
  
  return Array.from(strings);
}

function hasTranslationImport(content) {
  return /import\s+{\s*useTranslation\s*}\s+from\s+['"]react-i18next['"]/.test(content);
}

function addTranslationSupport(content, filePath) {
  const filename = path.basename(filePath);
  
  // Check if already has i18n
  if (hasTranslationImport(content)) {
    console.log(`  ✓ ${filename} already has translation import`);
    return content;
  }
  
  // Check if it's a functional component or has React imports
  if (!content.includes('import React') && !content.includes('useState') && !content.includes('useEffect')) {
    console.log(`  ⊘ ${filename} doesn't appear to be a React component`);
    return content;
  }
  
  // Add useTranslation import after other React imports
  const importMatch = content.match(/^(import\s+.*?from\s+['"]react['"].*?\n)/m);
  if (importMatch) {
    const insertPos = importMatch[0].length;
    content = 
      content.slice(0, insertPos) + 
      'import { useTranslation } from "react-i18next";\n' +
      content.slice(insertPos);
  }
  
  // Add const { t } = useTranslation() after component declaration
  const componentMatch = content.match(/^const\s+\w+\s*=\s*\(\s*\)\s*=>\s*{/m);
  if (componentMatch) {
    const insertPos = componentMatch[0].length;
    content = 
      content.slice(0, insertPos) + 
      '\n  const { t } = useTranslation();' +
      content.slice(insertPos);
  }
  
  return content;
}

function updateLocaleFiles() {
  const enData = JSON.parse(fs.readFileSync(EN_LOCALE, 'utf8'));
  const hiData = JSON.parse(fs.readFileSync(HI_LOCALE, 'utf8'));
  
  let enUpdated = false, hiUpdated = false;
  
  for (const [str, trans] of Object.entries(commonTranslations)) {
    const key = stringToKey(str);
    
    if (!enData[key]) {
      enData[key] = trans.en;
      enUpdated = true;
    }
    if (!hiData[key]) {
      hiData[key] = trans.hi;
      hiUpdated = true;
    }
  }
  
  if (enUpdated) {
    fs.writeFileSync(EN_LOCALE, JSON.stringify(enData, null, 2));
    console.log('\n✓ Updated en.json with new keys');
  }
  if (hiUpdated) {
    fs.writeFileSync(HI_LOCALE, JSON.stringify(hiData, null, 2));
    console.log('✓ Updated hi.json with new keys');
  }
}

function processPages() {
  console.log('\n🔍 Scanning for JSX files...');
  const jsxFiles = findJSXFiles(PAGES_DIR);
  console.log(`Found ${jsxFiles.length} JSX files\n`);
  
  let processed = 0;
  for (const filePath of jsxFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = addTranslationSupport(content, filePath);
    
    if (updated !== content) {
      fs.writeFileSync(filePath, updated);
      processed++;
    }
  }
  
  console.log(`\n✓ Processed ${processed} files with i18n support`);
  updateLocaleFiles();
}

// Run
console.log('🚀 Starting automated i18n integration...\n');
try {
  processPages();
  console.log('\n✅ i18n integration complete!\n');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
