import ThermalPrinter from './index.js';

const printer = new ThermalPrinter();

// USB Example
async function usbExample() {
  try {
    await printer.connectUSB(0x04b8, 0x0202); // Epson vendor/product IDs
    await printer.print('Hello from USB printer!');
    await printer.disconnect();
  } catch (error) {
    console.error('USB Error:', error.message);
  }
}

// Bluetooth Example
async function bluetoothExample() {
  try {
    console.log('Scanning for Bluetooth devices...');
    const devices = await printer.scanBluetooth(3000);
    console.log('Found devices:', devices);
    
    if (devices.length === 0) {
      console.log('No Bluetooth devices found');
    }
  } catch (error) {
    console.error('Bluetooth Error:', error.message);
    console.log('Note: Bluetooth scanning requires a Bluetooth adapter');
  }
}

// Receipt Example
async function receiptExample() {
  try {
    await printer.connectUSB(0x04b8, 0x0202);
    
    const items = [
      { name: 'Coffee', price: '3.50' },
      { name: 'Sandwich', price: '7.99' }
    ];
    
    await printer.printReceipt(items, '11.49');
    await printer.disconnect();
  } catch (error) {
    console.error('Receipt Error:', error.message);
  }
}

// Run examples
usbExample();
// bluetoothExample();
// receiptExample();
