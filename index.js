import { Printer } from '@node-escpos/core';
import USB from '@node-escpos/usb-adapter';
import noble from '@abandonware/noble';

// Simple Bluetooth device class for direct connection
class BluetoothDevice {
  constructor(address) {
    this.address = address;
    this.peripheral = null;
    this.characteristic = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
      
      noble.on('discover', async (peripheral) => {
        if (peripheral.address === this.address) {
          clearTimeout(timeout);
          this.peripheral = peripheral;
          
          try {
            await peripheral.connectAsync();
            const services = await peripheral.discoverServicesAsync();
            
            for (const service of services) {
              const characteristics = await service.discoverCharacteristicsAsync();
              const writeChar = characteristics.find(c => 
                c.properties.includes('write') || c.properties.includes('writeWithoutResponse')
              );
              
              if (writeChar) {
                this.characteristic = writeChar;
                resolve();
                return;
              }
            }
            reject(new Error('No writable characteristic found'));
          } catch (error) {
            reject(error);
          }
        }
      });
      
      noble.startScanning();
    });
  }

  async writeRaw(data) {
    if (!this.characteristic) throw new Error('Not connected');
    return this.characteristic.writeAsync(data, false);
  }

  async close() {
    if (this.peripheral) {
      await this.peripheral.disconnectAsync();
      this.peripheral = null;
      this.characteristic = null;
    }
  }
}

export class ThermalPrinter {
  constructor() {
    this.printer = null;
    this.device = null;
    this.connectionType = null;
  }

  // USB Connection
  async connectUSB(vendorId, productId) {
    this.device = new USB(vendorId, productId);
    await this.device.open();
    this.printer = new Printer(this.device);
    this.connectionType = 'USB';
    return this;
  }

  // Bluetooth Connection (direct)
  async connectBluetooth(address) {
    this.device = new BluetoothDevice(address);
    await this.device.open();
    this.connectionType = 'Bluetooth';
    return this;
  }

  // Scan for Bluetooth devices
  async scanBluetooth(timeout = 5000) {
    return new Promise((resolve) => {
      const devices = [];
      
      noble.on('discover', (peripheral) => {
        devices.push({
          id: peripheral.id,
          address: peripheral.address,
          name: peripheral.advertisement.localName || 'Unknown'
        });
      });

      noble.startScanning();
      
      setTimeout(() => {
        noble.stopScanning();
        resolve(devices);
      }, timeout);
    });
  }

  // Print text
  async print(text) {
    if (!this.device) throw new Error('Not connected');
    
    if (this.connectionType === 'USB') {
      this.printer.text(text).cut().close();
    } else {
      // Direct Bluetooth printing with ESC/POS commands
      const data = Buffer.concat([
        Buffer.from(text, 'utf8'),
        Buffer.from('\n'),
        Buffer.from([0x1D, 0x56, 0x00]) // Cut command
      ]);
      await this.device.writeRaw(data);
    }
  }

  // Print receipt
  async printReceipt(items, total) {
    if (!this.device) throw new Error('Not connected');
    
    if (this.connectionType === 'USB') {
      this.printer
        .align('center')
        .text('RECEIPT')
        .text('--------')
        .align('left');
      
      items.forEach(item => {
        this.printer.text(`${item.name} - $${item.price}`);
      });
      
      this.printer
        .text('--------')
        .text(`Total: $${total}`)
        .cut()
        .close();
    } else {
      // Direct Bluetooth receipt
      let receipt = '\x1B\x61\x01RECEIPT\n'; // Center align
      receipt += '--------\n';
      receipt += '\x1B\x61\x00'; // Left align
      
      items.forEach(item => {
        receipt += `${item.name} - $${item.price}\n`;
      });
      
      receipt += '--------\n';
      receipt += `Total: $${total}\n`;
      
      const data = Buffer.concat([
        Buffer.from(receipt, 'utf8'),
        Buffer.from([0x1D, 0x56, 0x00]) // Cut
      ]);
      await this.device.writeRaw(data);
    }
  }

  // Disconnect
  async disconnect() {
    if (this.device) {
      await this.device.close();
      this.device = null;
      this.printer = null;
      this.connectionType = null;
    }
  }
}

export default ThermalPrinter;
