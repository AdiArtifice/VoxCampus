const fs = require('fs');
const path = require('path');

console.log('🚀 Resetting VoxCampus project...');
console.log('Removing boilerplate and demo content...\n');

const filesToRemove = [
    // Common boilerplate files to remove
    'App.example.js',
    'README.template.md',
    'src/components/Demo',
    'src/screens/Demo',
    'assets/demo',
    // Add other boilerplate files you want to remove
];

const foldersToRemove = [
    'src/demo',
    'components/demo',
    // Add other demo folders
];

try {
    // Remove demo files
    filesToRemove.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath, { recursive: true, force: true });
            console.log(`✅ Removed: ${file}`);
        }
    });

    // Remove demo folders
    foldersToRemove.forEach(folder => {
        const folderPath = path.join(__dirname, '..', folder);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`✅ Removed folder: ${folder}`);
        }
    });

    // Clear npm cache
    console.log('\n🧹 Clearing caches...');

    console.log('\n✅ VoxCampus project reset successfully!');
    console.log('🎯 You can now start building your campus networking platform!');
    console.log('\nNext steps:');
    console.log('1. Update App.js with your main component');
    console.log('2. Configure your Appwrite settings');
    console.log('3. Start building VoxCampus features!');

} catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
}
