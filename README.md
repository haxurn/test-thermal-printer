# Thermal Printer SDK

Node.js SDK for thermal printing with USB and Bluetooth support.

## Installation

```bash
npm install
```

## Usage

```javascript
import ThermalPrinter from './index.js';

const printer = new ThermalPrinter();

// USB Connection
await printer.connectUSB(0x04b8, 0x0202);
await printer.print('Hello World!');
await printer.disconnect();

// Bluetooth Connection
const devices = await printer.scanBluetooth();
await printer.connectBluetooth(devices[0].address);
await printer.print('Hello Bluetooth!');
await printer.disconnect();
```

## API

- `connectUSB(vendorId, productId)` - Connect via USB
- `connectBluetooth(address)` - Connect via Bluetooth
- `scanBluetooth(timeout)` - Scan for Bluetooth devices
- `print(text)` - Print text
- `printReceipt(items, total)` - Print formatted receipt
- `disconnect()` - Close connection
