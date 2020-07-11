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

    async checkStates(stream, model){
        let state;
        let states = [];
        for(const item of stream){
            const date = new Date(millisecondsToTimestring(item[0]));
            const ISODate = date.toISOString();
            state = await model.exists({date: ISODate});
            states.push(state);
            // console.log(item, date, state);
        }
        return states;
    }

    // @private
    async _getMultiModel(asset, timeframe, stream){
        // Collection selector. Selects one of these collections: 5m, 15m, 1h, 4h, 1d
        const collectionName = `col${timeframe}`
        console.log(collectionName);
        const AssetModel = AssetDatabaseModel(collectionName);

        const states = await this.checkStates(stream, AssetModel);
        // console.log(states);
        // const foo = await stream.map((item) => {
        //     const date = new Date(millisecondsToTimestring(item[0]))
        //     let state =  AssetModel.exists({date: date})
        //     console.log(item, date, state);
        // });
        const doc = stream.map((item, index)=>{
            const date = new Date(millisecondsToTimestring(item[0]))
            // console.log(date, states[index]);
            if(!(states[index])){
                return {
                    asset: asset,
                    timeframe: timeframe,
                    stream: item,
                    date: date.toISOString()
                };
            }
        });

        // Sanitize doc array and remove any 'undefined' elements for those
        // docs that already exist in the db.
        // console.log(doc);
        let result = doc.filter((item) => {
            return item != null;
        });
        // console.log(result);
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
            // console.log(stream);
            //this.checkState(stream);
            const [currentAssetModel, multiStream] = await this._getMultiModel(asset, timeframe, stream);
            console.log('***', multiStream.length, '***');
            //Don't run the db stage if zero length stream received.
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
            throw new Error('Application failure has occurred!');
        }
    }
}

export { AssetDatabaseHandler, AssetDatabaseConnection };

// vim: fdm=marker ts=4
