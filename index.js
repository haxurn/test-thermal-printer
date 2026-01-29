import { Printer } from '@node-escpos/core';
import USB from '@node-escpos/usb-adapter';
import noble from '@abandonware/noble';

// Simple Bluetooth device class for direct connection
class BluetoothDevice {
  constructor(address) {
    this.address = address;
    this.peripheral = null;
    this.characteristic = null;
    this.encoding = 'utf8'; // Required by ESC/POS Printer
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

  write(data, encoding, callback) {
    if (!this.characteristic) {
      const error = new Error('Not connected');
      if (callback) return callback(error);
      throw error;
    }
    
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, encoding || 'utf8');
    
    this.characteristic.writeAsync(buffer, false)
      .then(() => callback && callback())
      .catch(error => callback && callback(error));
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
  }

  // USB Connection
  async connectUSB(vendorId, productId) {
    this.device = new USB(vendorId, productId);
    await this.device.open();
    this.printer = new Printer(this.device);
    return this;
  }

  // Bluetooth Connection
  async connectBluetooth(address) {
    this.device = new BluetoothDevice(address);
    await this.device.open();
    this.printer = new Printer(this.device);
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
    if (!this.printer) throw new Error('Not connected');
    
    this.printer
      .text(text)
      .cut()
      .close();
  }

  // Print receipt
  async printReceipt(items, total) {
    if (!this.printer) throw new Error('Not connected');
    
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
  }

  // Disconnect
  async disconnect() {
    if (this.device) {
      await this.device.close();
      this.device = null;
      this.printer = null;
    }
  }
}

export default ThermalPrinter;
