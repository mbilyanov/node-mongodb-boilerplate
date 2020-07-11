// Using ES6 imports
import mongoose from 'mongoose';
import { AssetDatabaseModel } from './assetdbModels.mjs';

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/priceTableDB';

const millisecondsToTimestring = (milliseconds) => {
    let dateObj = new Date(milliseconds);
    return dateObj.toUTCString();
}

class AssetDatabaseConnection{
    #server = null;
    #dbName = null;
    db = null;
    isConnected = false;

    constructor(server, database){
        this.#server = server;
        this.#dbName = database;
    }

    // @public
    async dbConnect(){
        console.log(`${this.#server}, ${this.#dbName}, ${mongoose.version}`);

        // Initial connection.
        await mongoose.connect(`mongodb://${this.#server}/${this.#dbName}`, { useUnifiedTopology: true, useNewUrlParser: true })
            // Initial connection is successful.
            .then(() => {
                // Get the default connection
                this.db = mongoose.connection;
                this.isConnected = true;

                // Once the connection is established we are good to set-up an 'errors' event
                // for any future connection issues.
                this.db.on('error', (err) => {
                    this.isConnected = false;
                    console.error(`MongoDB connection error has occurred!\n${err}`);
                });

                // Debug successful state.
                console.log('[INFO] Database connection established successfully.');
            })
            // Initial connection has failed.
            .catch(error => {
                console.log(`[ERROR] Database connection failed with the following error: ${error.message}`);
                throw new Error(error);
            });
    }

    // @public
    dbDisconnect(){
        this.db.close();
        this.isConnected = false;
    }
}

class AssetDatabaseHandler{
    constructor(){
    }
    // @private
    _getMultiModel(asset, timeframe, stream){
        // Collection selector. Selects one of these collections: 5m, 15m, 1h, 4h, 1d
        const AssetModel = AssetDatabaseModel(timeframe);
        const doc = stream.map((item)=>{
            const date = new Date(millisecondsToTimestring(item[0]))
            if(!(AssetModel.exists({date: date}))){
                return {
                    asset: 'BTC/EUR',
                    timeframe: '5m',
                    stream: item,
                    date: date.toISOString()
                };
            }
        });
        // Sanitize doc array and remove any 'undefined' elements for those
        // docs that already exist in the db.
        let result = doc.filter((item) => {
            return item != null;
        });

        return [AssetModel, result];
    }

    // @private
    _getSingleModel(asset, timeframe, stream){
        // Collection selector. Selects one of these collections: 5m, 15m, 1h, 4h, 1d
        var AssetModel = AssetDatabaseModel(timeframe);
        const timestamp = stream[0];
        const date = new Date(millisecondsToTimestring(timestamp))

        return new AssetModel({
            asset: asset,
            timeframe: timeframe,
            stream: stream,
            date: date.toISOString()
        });
    }

    // @public
    async dbSave(asset, timeframe, stream){
        return new Promise((resolve, reject) => {
            const currentAssetModel = this._getSingleModel(asset, timeframe, stream);

            // Refactor this into a try..catch..finally block.
            currentAssetModel.save()
                .then((res, collection) => {
                    console.log('SUCCESS:', res);
                    resolve('__OK__');
                })
                .catch((err) => {
                    console.log('ERROR:', err);
                    reject('__ERR__');
                })
                .finally(() => {
                    console.log('__DBSAVE:FINALLY__');
                });
        });
    }

    // @public
    async dbInsertMany(asset, timeframe, stream){
        try{
            const [currentAssetModel, multiStream] = this._getMultiModel(asset, timeframe, stream);

            // Don't run the db stage if zero lenght stream received.
            if(!multiStream.length==0){
                // Refactor this into a try..catch..finally block.
                try{
                    await currentAssetModel.insertMany(multiStream);
                    console.log('<SUCCESS>');
                }catch(err){
                    console.log('<ERROR>', err);
                }finally{
                    console.log('__DBINSERTMANY:FINALLY__');
                };
            }else{
                // await sleep(1000);
                console.log('[WARNNING] No unique documents to add.');
            }
        }catch(err){
            throw new Error('Application failure has occured!');
        }
    }
}

export { AssetDatabaseHandler, AssetDatabaseConnection };

// vim: fdm=marker ts=4
