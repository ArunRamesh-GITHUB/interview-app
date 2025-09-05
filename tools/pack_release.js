#!/usr/bin/env node

/**
 * Release Packaging Script
 * Validates project and packages release documentation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const MOBILE_SHELL = path.join(PROJECT_ROOT, 'mobile-shell');
const RELEASE_DIR = path.join(PROJECT_ROOT, 'RELEASE');

console.log('🚀 Release Packaging Script');
console.log('==========================');

// Validation functions
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: Found`);
    return true;
  } else {
    console.log(`❌ ${description}: Missing - ${filePath}`);
    return false;
  }
}

function validatePackageJson() {
  console.log('\n📦 Validating package.json...');
  const packagePath = path.join(MOBILE_SHELL, 'package.json');
  
  if (!checkFileExists(packagePath, 'package.json')) return false;
  
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = [
      'build:android',
      'build:ios', 
      'build:android:preview',
      'build:ios:preview',
      'submit:android',
      'submit:ios',
      'doctor'
    ];
    
    let allScriptsPresent = true;
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        console.log(`✅ Script '${script}': Found`);
      } else {
        console.log(`❌ Script '${script}': Missing`);
        allScriptsPresent = false;
      }
    });
    
    return allScriptsPresent;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

function validateAppJson() {
  console.log('\n📱 Validating app.json...');
  const appJsonPath = path.join(MOBILE_SHELL, 'app.json');
  
  if (!checkFileExists(appJsonPath, 'app.json')) return false;
  
  try {
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appConfig.expo;
    
    if (!expo) {
      console.log('❌ app.json missing expo configuration');
      return false;
    }
    
    // Check required fields
    const required = [
      ['name', 'App name'],
      ['slug', 'App slug'],
      ['version', 'Version'],
      ['icon', 'App icon'],
      ['splash', 'Splash screen']
    ];
    
    let allFieldsPresent = true;
    required.forEach(([field, description]) => {
      if (expo[field]) {
        console.log(`✅ ${description}: ${typeof expo[field] === 'object' ? 'Configured' : expo[field]}`);
      } else {
        console.log(`❌ ${description}: Missing`);
        allFieldsPresent = false;
      }
    });
    
    // Check platform configs
    if (expo.android && expo.android.package) {
      console.log(`✅ Android package: ${expo.android.package}`);
    } else {
      console.log('❌ Android package ID missing');
      allFieldsPresent = false;
    }
    
    if (expo.ios && expo.ios.bundleIdentifier) {
      console.log(`✅ iOS bundle ID: ${expo.ios.bundleIdentifier}`);
    } else {
      console.log('❌ iOS bundle identifier missing');
      allFieldsPresent = false;
    }
    
    return allFieldsPresent;
  } catch (error) {
    console.log(`❌ Error reading app.json: ${error.message}`);
    return false;
  }
}

function validateEasJson() {
  console.log('\n🔧 Validating eas.json...');
  const easJsonPath = path.join(MOBILE_SHELL, 'eas.json');
  
  if (!checkFileExists(easJsonPath, 'eas.json')) return false;
  
  try {
    const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    
    if (!easConfig.build) {
      console.log('❌ eas.json missing build configuration');
      return false;
    }
    
    const profiles = ['preview', 'production'];
    let allProfilesValid = true;
    
    profiles.forEach(profile => {
      if (easConfig.build[profile]) {
        console.log(`✅ Build profile '${profile}': Configured`);
        
        // Check production profile specifics
        if (profile === 'production') {
          if (easConfig.build[profile].developmentClient === false) {
            console.log('✅ Production profile: developmentClient disabled');
          } else {
            console.log('❌ Production profile: developmentClient should be false');
            allProfilesValid = false;
          }
        }
      } else {
        console.log(`❌ Build profile '${profile}': Missing`);
        allProfilesValid = false;
      }
    });
    
    return allProfilesValid;
  } catch (error) {
    console.log(`❌ Error reading eas.json: ${error.message}`);
    return false;
  }
}

function validateAssets() {
  console.log('\n🎨 Validating assets...');
  const assetsDir = path.join(MOBILE_SHELL, 'assets');
  
  const requiredAssets = [
    'icon.png',
    'splash.png', 
    'adaptive-icon.png'
  ];
  
  let allAssetsPresent = true;
  requiredAssets.forEach(asset => {
    const assetPath = path.join(assetsDir, asset);
    if (!checkFileExists(assetPath, `Asset: ${asset}`)) {
      allAssetsPresent = false;
    }
  });
  
  return allAssetsPresent;
}

function validateReleaseDocumentation() {
  console.log('\n📄 Validating release documentation...');
  
  const requiredDocs = [
    '00_AUDIT.md',
    '01_CREDENTIALS.md',
    '02_ASSETS_README.md',
    '03_PRIVACY.md',
    '04_DATA_FORMS.md',
    '05_MONETIZATION.md'
  ];
  
  let allDocsPresent = true;
  requiredDocs.forEach(doc => {
    const docPath = path.join(RELEASE_DIR, doc);
    if (!checkFileExists(docPath, `Documentation: ${doc}`)) {
      allDocsPresent = false;
    }
  });
  
  return allDocsPresent;
}

function runValidation() {
  console.log('🔍 Running project validation...\n');
  
  const validations = [
    validatePackageJson,
    validateAppJson,
    validateEasJson,
    validateAssets,
    validateReleaseDocumentation
  ];
  
  let allValid = true;
  validations.forEach(validation => {
    if (!validation()) {
      allValid = false;
    }
  });
  
  console.log('\n' + '='.repeat(40));
  if (allValid) {
    console.log('✅ All validations passed!');
    console.log('🚀 Project is ready for build and submission');
  } else {
    console.log('❌ Some validations failed');
    console.log('🔧 Please fix the issues above before proceeding');
    process.exit(1);
  }
  
  console.log('='.repeat(40));
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}

export { runValidation };