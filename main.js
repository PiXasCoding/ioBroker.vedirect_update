'use strict';

/*
 * Created with @iobroker/create-adapter v1.16.0
   VE.Direct Protocol Version 3.33 from 6. June 2023
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');
// Load your modules here, e.g.:
const {SerialPort, ReadlineParser} = require('serialport');
const stateAttr = require(__dirname + '/lib/stateAttr.js');
const ProductNames = require(__dirname + '/lib/ProductNames.js');
const ErrorNames = require(__dirname + '/lib/ErrorNames.js');
const AlarmReasons = require(__dirname + '/lib/AlarmReasons.js');
const OperationStates = require(__dirname + '/lib/OperationStates.js');
const OffReasons = require(__dirname + '/lib/OffReasons.js');
const DeviceModes = require(__dirname + '/lib/DeviceModes.js');
const MpptModes = require(__dirname + '/lib/MpptModes.js');
const BleReasons = require(__dirname + '/lib/BleReasons.js');
const MonitorTypes = require(__dirname + '/lib/MonitorTypes.js');
const warnMessages = {}; // Array to avoid unneeded spam too sentry
let bufferMessage = false;
const timeouts = {};
let polling, port;
// *********************** Code change by PixasCoding START **********************
let VE_Direct_BlockStart = false; //                                             *
// *********************** Code change by PixasCoding END ************************

const disableSentry = true; // Ensure to set to true during development !

class Vedirect extends utils.Adapter {
	/**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
	constructor(options) {
		// @ts-ignore
		super({
			...options,
			name: 'vedirect',
		});
		this.on('ready', this.onReady.bind(this));
		// this.on('objectChange', this.onObjectChange.bind(this));
		// this.on('stateChange', this.onStateChange.bind(this));
		// this.on('message', this.onMessage.bind(this));
		this.on('unload', this.onUnload.bind(this));
		this.createdStatesDetails = {}; //  Array to store state objects to avoid unneeded object changes
	}

	/**
     * Is called when databases are connected and adapter received configuration.
     */
	async onReady() {
		// Initialize your adapter here
		this.log.info('Starting VE.Direct with Protocol Version 3.33 and configurable expiring state capability');
		this.setState('info.connection', false, true);

		try {
			// Open Serial port connection
			const USB_Device = this.config.USBDevice;
			port = new SerialPort({
				path: USB_Device,
				baudRate: 19200
			});

			port.on('error', (error) => {
				this.log.error('Issue handling serial port connection : ' + JSON.stringify(error));
				this.setState('info.connection', false, true);
			});

			// Open pipe and listen to parser to get data
// *********************** Code change by PixasCoding START **********************
this.setState('info.connection', true, true); //                                 *
// *********************** Code change by PixasCoding END ************************
			const parser = port.pipe(new ReadlineParser({delimiter: '\r\n'}));

	 		parser.on('data', (data) => {
				this.log.debug(`[Serial data received] ${data}`)
				if (!bufferMessage) {
					this.log.debug(`Message buffer inactive, processing data`);
					this.parse_serial(data);
// *********************** Code change by PixasCoding START **********************
if (data.search("PID") > -1 ) { //                                               *
VE_Direct_BlockStart = true; //                                                  *
} //                                                                             *
if (data.search("Checksum") > -1 && VE_Direct_BlockStart) { //                   *
// *********************** Code change by PixasCoding END ************************
					if (this.config.messageBuffer > 0) {
 						this.log.debug(`Activate Message buffer with delay of ${this.config.messageBuffer * 1000}`);
						bufferMessage = true;
						if (timeouts['mesageBuffer']) {clearTimeout(timeouts['mesageBuffer']); timeouts['mesageBuffer'] = null;}
						timeouts['mesageBuffer'] = setTimeout(()=> {
							bufferMessage = false;
// *********************** Code change by PixasCoding START **********************
VE_Direct_BlockStart = false; //                                                 *
// *********************** Code change by PixasCoding END ************************
							this.log.debug(`Message buffer timeout reached, will process data`);
						}, this.config.messageBuffer * 1000);
					}
// *********************** Code change by PixasCoding START **********************
} //                                                                             *
// *********************** Code change by PixasCoding END ************************
				} else {
					this.log.debug(`Message buffer active, message ignored`);
				}

				// Indicate connection status
// *********************** Code change by PixasCoding START **********************
//				this.setState('info.connection', true, true); // *
// *********************** Code change by PixasCoding END ************************
				// Clear running timer
				(function () {
					if (polling) {
						clearTimeout(polling);
						polling = null;
					}
				})();
				// timer
				polling = setTimeout(() => {
					// Set time-out on connecting state when 10 seconds no information received
					this.setState('info.connection', false, true);
					this.log.error('No data received for 10 seconds, connection lost ?');
				}, 10000);

			});

			parser.on('error', (error) => {
				this.log.error('Issue handling serial port connection : ' + JSON.stringify(error));
				this.setState('info.connection', false, true);
			});

		} catch (error) {
			this.log.error('Connection to VE.Direct device failed !');
			this.setState('info.connection', false, true);
			this.errorHandler(error);
		}
	}

	async parse_serial(line) {
		try {
			this.log.debug('Line : ' + line);
			const res = line.split('\t');
			if (stateAttr[res[0]] !== undefined) {
				switch (res[0]) {   // Used for special modifications to write a state with correct values and types
					case 'CE':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'V':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'V2':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'V3':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'VS':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'VM':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'DM':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 10);
						break;

					case 'VPV':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'I':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'I2':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'I3':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'IL':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'SOC':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 10);
						break;

					case 'AR':
						this.stateSetCreate(res[0], res[0], await this.get_alarm_reason(res[1]));
						break;

					case 'WARN':
						this.stateSetCreate(res[0], res[0], await this.get_alarm_reason(res[1]));
						break;

					case 'OR':
						this.stateSetCreate(res[0], res[0], await this.get_off_reason(res[1]));
						break;

					case 'H6':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'H7':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'H8':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'H15':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'H16':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 1000);
						break;

					case 'H17':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'H18':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'H19':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'H20':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'H22':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'ERR':
						this.stateSetCreate(res[0], res[0], await this.get_err_state(res[1]));
						break;

					case 'CS':
						this.stateSetCreate(res[0], res[0], await this.get_cs_state(res[1]));
						break;

					case 'PID':
						this.stateSetCreate(res[0], res[0], await this.get_product_longname(res[1]));
						break;

					case 'MODE':
						this.stateSetCreate(res[0], res[0], await this.get_device_mode(res[1]));
						break;

					case 'AC_OUT_V':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'AC_OUT_I':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 10);
						break;

					case 'MPPT':
						this.stateSetCreate(res[0], res[0], await this.get_mppt_mode(res[1]));
						break;

					case 'MON':
						this.stateSetCreate(res[0], res[0], await this.get_monitor_type(res[1]));
						break;

					case 'DC_IN_V':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 100);
						break;

					case 'DC_IN_I':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]) / 10);
						break;

					case 'DC_IN_P':
						this.stateSetCreate(res[0], res[0], Math.floor(res[1]));
						break;

					default:    // Used for all other measure points with no required special handling
						this.stateSetCreate(res[0], res[0], res[1]);
						break;
				}
			}


		} catch (error) {
			this.log.error('Connection to VE.Direct device failed !');
			this.setState('info.connection', false, true);
			this.errorHandler(error);
		}
	}


	/**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
	onUnload(callback) {
		this.setState('info.connection', false, true);
		try {

			port.close();
			this.log.info('VE.Direct terminated, all USB connections closed');
			if (timeouts['mesageBuffer']) {clearTimeout(timeouts['mesageBuffer']); timeouts['mesageBuffer'] = null;}

			callback();
		} catch (e) {
			callback();
			this.sendSentry(`[onUnload] ${e}`);
		}
	}

	async get_product_longname(pid) {
		let name;
		try {
			name = ProductNames[pid].pid;
		} catch (error) {
			name = 'unknown PID = ' + pid;
		}
		return name;
	}

	async get_alarm_reason(ar) {
		let name;
		try {
			name = AlarmReasons[ar].reason;
		} catch (error) {
			name = 'unknown alarm reason = ' + ar;
		}
		return name;
	}

	async get_off_reason(or) {
		let name = null;
		try {
			name = OffReasons[or].reason;
		} catch (error) {
			name = 'unknown off reason = ' + or;
		}
		return name;
	}

	async get_cap_ble(ble) {
		let name;
		try {
			name = BleReasons[ble].reason;
		} catch (error) {
			name = 'unknown BLE reason = '+ ble;
		}
		return name;
	}

	async get_cs_state(cs) {
		let name;
		try {
			name = OperationStates[cs].state;
		} catch (error) {
			name = 'unknown operation state = ' + cs;
		}
		return name;
	}

	async get_err_state(err) {
		let name;
		try {
			name = ErrorNames[err].error;
		} catch (error) {
			name = 'unknown error state = ' + err;
		}
		return name;
	}

	async get_device_mode(mode) {
		let name;
		try {
			name = DeviceModes[mode].mode;
		} catch (error) {
			name = 'unknown device mode = ' + mode;
		}
		return name;
	}

	async get_mppt_mode(mppt) {
		let name;
		try {
			name = MpptModes[mppt].mode;
		} catch (error) {
			name = 'unknown mppt mode = ' + mppt;
		}
		return name;
	}

	async get_monitor_type(monitortype) {
		let name;
		try {
			name = MonitorTypes[monitortype].type;
		} catch (error) {
			name = 'unknown monitor type = ' + monitortype;
		}
		return name;
	}

	/**
     * @param stateName {string} ID of the state
     * @param name {string} Name of state (also used for stattAttrlib!)
     * @param value {boolean | number | string | null} Value of the state
     */
	stateSetCreate(stateName, name, value) {
		this.log.debug('[stateSetCreate]' + stateName + ' with value : ' + value);
		// const expireTime = 0;
		try {
			// Try to get details from state lib, if not use defaults. throw warning is states is not known in attribute list
			const common = {};
			if (!stateAttr[name]) {
				const warnMessage = `State attribute definition missing for + ${name}`;
				if (warnMessages[name] !== warnMessage) {
					warnMessages[name] = warnMessage;
					// Send information to Sentry
					this.sendSentry(warnMessage);
				}
			}
			const createStateName = stateName;
			this.log.debug('[stateSetCreate] state attribute from lib ' + JSON.stringify(stateAttr[name]));
			common.name = stateAttr[name] !== undefined ? stateAttr[name].name || name : name;
			common.type = stateAttr[name] !== undefined ? stateAttr[name].type || typeof (value) : typeof (value);
			common.role = stateAttr[name] !== undefined ? stateAttr[name].role || 'state' : 'state';
			common.read = true;
			common.unit = stateAttr[name] !== undefined ? stateAttr[name].unit || '' : '';
			common.write = stateAttr[name] !== undefined ? stateAttr[name].write || false : false;

			if ((!this.createdStatesDetails[stateName]) || (this.createdStatesDetails[stateName] && (
				common.name !== this.createdStatesDetails[stateName].name ||
                    common.name !== this.createdStatesDetails[stateName].name ||
                    common.type !== this.createdStatesDetails[stateName].type ||
                    common.role !== this.createdStatesDetails[stateName].role ||
                    common.read !== this.createdStatesDetails[stateName].read ||
                    common.unit !== this.createdStatesDetails[stateName].unit ||
                    common.write !== this.createdStatesDetails[stateName].write)
			)) {
				this.log.debug(`[stateSetCreate] An attribute has changed for : ${stateName}`);

				this.extendObject(createStateName, {
					type: 'state',
					common
				});

			} else {
				this.log.debug(`[stateSetCreate] No attribute changes for : ${stateName}, processing normally`);
			}

			// Store current object definition to memory
			this.createdStatesDetails[stateName] = common;

			// Set value to state including expiration time
			if (value != null) {
				let expireTime = 0;
				// Check if state should expire and expiration of states is active in config, if yes use preferred time
				if (this.config.expireTime != null){
					if (stateAttr[name].expire != null){
						if (stateAttr[name].expire === true) {
							expireTime = Number(this.config.expireTime);
						}
						if (stateAttr[name].expire === false){
							expireTime = 0;
						}
					}
				}

				if (common.type === 'number') {
					value = parseFloat(value);
				}
				this.setStateChanged(createStateName, {
					val: value,
					ack: true,
					expire: expireTime
				});
			}

			// Subscribe on state changes if writable
			common.write && this.subscribeStates(createStateName);
			this.log.debug('[stateSetCreate] All createdStatesDetails' + JSON.stringify(this.createdStatesDetails));
		} catch (error) {
			this.sendSentry(`[stateSetCreate] ${error}`);
		}
	}

	errorHandler(source, error, debugMode) {
		let message = error;
		if (error instanceof Error && error.stack != null) message = error.stack;
		if (!debugMode) {
			this.log.error(`${source} ${error}`);
			this.sendSentry(`${message}`);
		} else {
			this.log.error(`${source} ${error}`);
			this.log.debug(`${source} ${message}`);
		}
	}

	/**
     * Send error's to sentry, only if sentry not disabled
     * @param {string} msg ID of the state
     */
	sendSentry(msg) {

		if (!disableSentry) {
			this.log.info(`[Error catched and send to Sentry, thank you collaborating!] error: ${msg}`);
			if (this.supportsFeature && this.supportsFeature('PLUGINS')) {
				const sentryInstance = this.getPluginInstance('sentry');
				if (sentryInstance) {
					sentryInstance.getSentryObject().captureException(msg);
				}
			}
		} else {
			this.log.error(`Sentry disabled, error catched : ${msg}`);
		}
	}

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
	module.exports = (options) => new Vedirect(options);
} else {
	// otherwise start the instance directly
	new Vedirect();
}
