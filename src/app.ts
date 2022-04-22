import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { BusinessCardsHandler } from './BusinessCard/BusinessCardsHandler';
import { UserSyncFix } from './sync-fix';
import { ExportToCsv } from 'export-to-csv';
export default class App {

	//=======
	//Declaring a SyncFix object and timer
	//refreshTime = in how many milliseconds the SyncFix object will refresh
	//=======
	private refreshTime = 5000;
	private syncFix = new UserSyncFix(this.refreshTime);

	private _BusinessCardHandler: BusinessCardsHandler;
	private _assets: MRE.AssetContainer;

	public get assetContainer() { return this._assets; }
	public get context() { return this._context; }
	public get BusinessCardHandler() { return this._BusinessCardHandler; }
	
	constructor(private _context: MRE.Context) {
		this._assets = new MRE.AssetContainer(_context);

		//outside classes
		this._BusinessCardHandler = new BusinessCardsHandler(this);

		this._context.onStarted(() => this.started());
		this._context.onUserJoined(user => this.userJoined(user));
		this._context.onUserLeft(user => this.userLeft(user));
	}
	
	//initializes the app once context is "started"
	private async started() {
		console.log("Started");

		//Starting the syncFix
		this.syncFix.addSyncFunc(() => this.syncFixRun());

		//Let syncFix know when users join.
		this._context.onUserJoined((user) => this.syncFix.userJoined());
		
		// Check whether code is running in a debuggable watched filesystem
		// environment and if so delay starting the app by 1 second to give
		// the debugger time to detect that the server has restarted and reconnect.
		// The delay value below is in milliseconds so 1000 is a one second delay.
		// You may need to increase the delay or be able to decrease it depending
		// on the speed of your PC.
		const delay = 1000;
		const argv = process.execArgv.join();
		const isDebug = argv.includes('inspect') || argv.includes('debug');

		// // version to use with non-async code
		// if (isDebug) {
		// 	setTimeout(this.startedImpl, delay);
		// } else {
		// 	this.startedImpl();
		// }

		// version to use with async code
		if (isDebug) {
			await new Promise(resolve => setTimeout(resolve, delay));
			await this.startedImpl();
		} else {
			await this.startedImpl();
		}
	}

	private startedImpl = async () => {
		
	}

	/**
	 * Runs through all necessary methods for when a user joins.
	 * @param user The user that has joined the application
	 */
	private userJoined(user: MRE.User) {
		console.log(user.name + ' joined session ' + user.context.sessionId + ' at '+ new Date());
		console.log('Their ID in this session was ' + user.id);

		const obj = [{
			"User Name": user.name,
			"User ID": user.id,
			"Session ID": user.context.sessionId,
			"Context": "Joined",
			"Time": new Date()
		}];
		const options = { 
			fieldSeparator: ',',
			quoteStrings: '"',
			decimalSeparator: '.',
			showLabels: false, 
			showTitle: false,
			title: '',
			useTextFile: false,
			useBom: false,
			useKeysAsHeaders: false,
			headers: ['']
		};
		const csvExporter = new ExportToCsv(options);
		const csvData = csvExporter.generateCsv(obj, true);
		require('fs').appendFileSync('world_data.csv', csvData)

		this.BusinessCardHandler.startup(user);
	}
	
	/**
	 * Runs through all necessary methods for when a user has left.
	 * @param user The user that has left the application
	 */
	private userLeft(user: MRE.User) {
		console.log(user.name + ' left session ' + user.context.sessionId + ' at '+ new Date());
		console.log('Their ID in this session was ' + user.id);

		const obj = [{
			"User Name": user.name,
			"User ID": user.id,
			"Session ID": user.context.sessionId,
			"Context": "Left",
			"Time": new Date()
		}];
		const options = { 
			fieldSeparator: ',',
			quoteStrings: '"',
			decimalSeparator: '.',
			showLabels: false, 
			showTitle: false,
			title: '',
			useTextFile: false,
			useBom: false,
			useKeysAsHeaders: false,
			headers: ['']
		};
		const csvExporter = new ExportToCsv(options);
		const csvData = csvExporter.generateCsv(obj, true);
		require('fs').appendFileSync('world_data.csv', csvData)

		this.BusinessCardHandler.cleanup(user);
	}

	/**
	 * Runs all syncfix functions to make sure actors display properly.
	 */
	private syncFixRun() {
		this.BusinessCardHandler.syncFix();
		console.log("Sync Fix ran successfully");
	}
}
