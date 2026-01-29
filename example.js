import ThermalPrinter from './index.js';
import readline from 'readline';

const printer = new ThermalPrinter();
let isConnected = false;
let connectionType = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function showMenu() {
  console.log('\n=== Thermal Printer Manager ===');
  console.log('1. Scan Bluetooth devices');
  console.log('2. Connect USB printer');
  console.log('3. Connect Bluetooth printer');
  console.log('4. Print text');
  console.log('5. Print receipt');
  console.log('6. Disconnect');
  console.log('7. Exit');
  console.log(`Status: ${isConnected ? `Connected (${connectionType})` : 'Disconnected'}`);
  console.log('================================');
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function scanBluetooth() {
  console.log('Scanning for Bluetooth devices...');
  try {
    const devices = await printer.scanBluetooth(5000);
    if (devices.length === 0) {
      console.log('No devices found');
    } else {
      console.log('Found devices:');
      devices.forEach((device, index) => {
        console.log(`${index + 1}. ${device.name} (${device.address})`);
      });
    }
    return devices;
  } catch (error) {
    console.error('Bluetooth scan failed:', error.message);
    return [];
  }
}

async function connectUSB() {
  const vendorId = await askQuestion('Enter Vendor ID (hex, e.g., 0x04b8): ');
  const productId = await askQuestion('Enter Product ID (hex, e.g., 0x0202): ');
  
  try {
    const vid = parseInt(vendorId);
    const pid = parseInt(productId);
    await printer.connectUSB(vid, pid);
    isConnected = true;
    connectionType = 'USB';
    console.log('✓ USB printer connected');
  } catch (error) {
    console.error('USB connection failed:', error.message);
  }
}

async function connectBluetooth() {
  const devices = await scanBluetooth();
  if (devices.length === 0) return;
  
  const choice = await askQuestion('Select device number (or enter MAC address): ');
  let address;
  
  if (choice.includes(':')) {
    address = choice;
  } else {
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < devices.length) {
      address = devices[index].address;
    } else {
      console.log('Invalid selection');
      return;
    }
  }
  
  console.log('Note: Bluetooth printing not fully implemented due to adapter issues');
  console.log(`Would connect to: ${address}`);
}

async function printText() {
  if (!isConnected) {
    console.log('Please connect to a printer first');
    return;
  }
  
  const text = await askQuestion('Enter text to print: ');
  try {
    await printer.print(text);
    console.log('✓ Text printed');
  } catch (error) {
    console.error('Print failed:', error.message);
  }
}

async function printReceipt() {
  if (!isConnected) {
    console.log('Please connect to a printer first');
    return;
  }
  
  const items = [
    { name: 'Coffee', price: '3.50' },
    { name: 'Sandwich', price: '7.99' },
    { name: 'Cookie', price: '2.25' }
  ];
  
  try {
    await printer.printReceipt(items, '13.74');
    console.log('✓ Receipt printed');
  } catch (error) {
    console.error('Receipt print failed:', error.message);
  }
}

async function disconnect() {
  if (!isConnected) {
    console.log('Not connected');
    return;
  }
  
  try {
    await printer.disconnect();
    isConnected = false;
    connectionType = null;
    console.log('✓ Disconnected');
  } catch (error) {
    console.error('Disconnect failed:', error.message);
  }
}

async function main() {
  console.log('Welcome to Thermal Printer Manager');
  
  while (true) {
    showMenu();
    const choice = await askQuestion('Select option: ');
    
    switch (choice) {
      case '1':
        await scanBluetooth();
        break;
      case '2':
        await connectUSB();
        break;
      case '3':
        await connectBluetooth();
        break;
      case '4':
        await printText();
        break;
      case '5':
        await printReceipt();
        break;
      case '6':
        await disconnect();
        break;
      case '7':
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
      default:
        console.log('Invalid option');
    }
  }
}

main().catch(console.error);
