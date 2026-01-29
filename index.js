import { Printer } from '@node-escpos/core';
import USB from '@node-escpos/usb-adapter';
import noble from '@abandonware/noble';

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

  // Print text (USB only for now)
  async print(text) {
    if (!this.printer) throw new Error('Not connected');
    
    this.printer
      .text(text)
      .cut()
      .close();
  }

  // Print receipt (USB only for now)
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
